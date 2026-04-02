import { config } from 'dotenv';
import { Worker } from 'bullmq';
import { WorkflowInterpreter, PlanExecutor, type RetrievalService } from '@agentops/workflow';
import { db } from '@agentops/db';
import { workflowRuns, knowledgeChunks, reviewTasks } from '@agentops/db/schema';
import { eq, desc } from 'drizzle-orm';
import WebSocket from 'ws';
import { createLLMProvider } from '@agentops/ai';

// Retrieval service implementation using OpenAI embeddings
const retrievalService: RetrievalService = {
  async retrieve(projectId: string, query: string, topK: number) {
    const provider = createLLMProvider('openai', process.env.OPENAI_API_KEY);

    // Generate query embedding
    const queryEmbedding = await provider.embed!({ text: query });
    const queryVector = queryEmbedding.vector;

    // Fetch chunks for this project
    const chunks = await db.query.knowledgeChunks.findMany({
      where: eq(knowledgeChunks.projectId, projectId),
      orderBy: [desc(knowledgeChunks.createdAt)],
      limit: 100, // Get enough chunks to filter
    });

    // Calculate cosine similarity and sort
    const scoredChunks = chunks
      .map((chunk) => {
        if (!chunk.embedding) return null;
        try {
          const chunkVector = JSON.parse(chunk.embedding);
          const similarity = cosineSimilarity(queryVector, chunkVector);
          return {
            content: chunk.content,
            score: similarity,
            metadata: chunk.metadata || {},
            chunkIndex: chunk.chunkIndex,
          };
        } catch {
          return null;
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scoredChunks;
  },
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

config({ path: '../../.env' });

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

const WS_URL = process.env.WS_URL || 'ws://localhost:3002';

let wsClient: WebSocket | null = null;

function getWebSocketClient(): WebSocket {
  if (!wsClient || wsClient.readyState === WebSocket.CLOSED) {
    wsClient = new WebSocket(WS_URL);
    wsClient.on('error', (err: Error) => {
      console.error('WebSocket connection error:', err.message);
      wsClient = null;
    });
    wsClient.on('close', () => {
      console.log('WebSocket connection closed');
      wsClient = null;
    });
  }
  return wsClient;
}

function broadcastRunUpdate(runId: string, update: Record<string, unknown>) {
  const ws = getWebSocketClient();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'run_update',
      runId,
      ...update,
    }));
  }
}

function safeJsonSerialize(obj: any): any {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  }));
}

// Worker for AI workflow interpretation
const workflowInterpretWorker = new Worker(
  'workflow-interpret',
  async (job) => {
    console.log('Processing workflow interpret job', job.id, job.data);

    const { runId, workflowVersionId, definition, input } = job.data;

    // Update status to interpreting
    await db
      .update(workflowRuns)
      .set({ status: 'interpreting', startedAt: new Date() })
      .where(eq(workflowRuns.id, runId));

    broadcastRunUpdate(runId, { status: 'interpreting' });

    try {
      // Create interpreter and generate execution plan
      const interpreter = new WorkflowInterpreter('anthropic', process.env.ANTHROPIC_API_KEY);
      const interpretationResult = await interpreter.interpret(definition, input || {});

      // Update run with interpretation
      await db
        .update(workflowRuns)
        .set({
          status: 'planning',
          interpretationPrompt: interpretationResult.prompt,
          executionPlan: safeJsonSerialize(interpretationResult.executionPlan),
        })
        .where(eq(workflowRuns.id, runId));

      broadcastRunUpdate(runId, {
        status: 'planning',
        interpretation: {
          description: interpretationResult.naturalLanguageDescription,
          plan: interpretationResult.executionPlan,
        },
      });

      console.log('Workflow interpretation complete', interpretationResult.executionPlan);
      return { status: 'interpreted', interpretation: interpretationResult };
    } catch (error) {
      await db
        .update(workflowRuns)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Interpretation failed',
          finishedAt: new Date(),
        })
        .where(eq(workflowRuns.id, runId));

      broadcastRunUpdate(runId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Interpretation failed',
      });

      throw error;
    }
  },
  { connection }
);

// Worker for AI-guided workflow execution
const workflowExecutionWorker = new Worker(
  'workflow-execution',
  async (job) => {
    console.log('Processing workflow execution job', job.id, job.data);

    const { runId, executionPlan, input, resumeFromStepId, approvedOutput } = job.data;

    // Update status to executing
    await db
      .update(workflowRuns)
      .set({ status: 'executing' })
      .where(eq(workflowRuns.id, runId));

    broadcastRunUpdate(runId, { status: 'executing' });

    try {
      // Create executor
      const executor = new PlanExecutor('anthropic', process.env.ANTHROPIC_API_KEY);
      executor.setRetrievalService({
        retrieve: async (projectId: string, query: string, topK: number) => {
          return retrievalService.retrieve(projectId, query, topK);
        },
      });

      // Handle resume from a paused step
      const context = input || {};
      if (resumeFromStepId && approvedOutput) {
        context[resumeFromStepId] = approvedOutput;
      }

      // Execute the plan
      const result = await executor.execute(
        executionPlan,
        context,
        {
          onStepStart: (stepId, step) => {
            console.log(`Starting step: ${stepId} - ${step.nodeName}`);
            broadcastRunUpdate(runId, { type: 'step_start', stepId, step });
          },
          onStepComplete: (stepId, step, output) => {
            console.log(`Completed step: ${stepId} - ${step.nodeName}`);
            broadcastRunUpdate(runId, { type: 'step_complete', stepId, output });
          },
          onPause: async (stepId, reason, ctx) => {
            console.log(`Paused at step: ${stepId} - ${reason}`);
            broadcastRunUpdate(runId, { type: 'pause', stepId, reason });

            // Create review task for manual review
            await db.insert(reviewTasks).values({
              workflowRunId: runId,
              workflowNodeRunId: stepId, // Using stepId as placeholder
              status: 'pending',
              reviewedOutput: safeJsonSerialize(ctx),
            });
          },
        }
      );

      // Update final status
      await db
        .update(workflowRuns)
        .set({
          status: result.status,
          outputPayload: safeJsonSerialize(result.output),
          finishedAt: new Date(),
          totalTokens: result.totalTokens,
          totalCost: result.totalCost.toString(),
        })
        .where(eq(workflowRuns.id, runId));

      broadcastRunUpdate(runId, {
        status: result.status,
        output: result.output,
        finishedAt: new Date().toISOString(),
      });

      console.log('Workflow execution complete', result.status);
      return result;
    } catch (error) {
      await db
        .update(workflowRuns)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Execution failed',
          finishedAt: new Date(),
        })
        .where(eq(workflowRuns.id, runId));

      broadcastRunUpdate(runId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Execution failed',
      });

      throw error;
    }
  },
  { connection }
);

// Worker for continuing workflow after review approval
const workflowContinueWorker = new Worker(
  'workflow-continue',
  async (job) => {
    console.log('Processing workflow continue job', job.id, job.data);

    const { runId, executionPlan, context, resumeFromStepId, approvedOutput } = job.data;

    await db
      .update(workflowRuns)
      .set({ status: 'executing' })
      .where(eq(workflowRuns.id, runId));

    broadcastRunUpdate(runId, { status: 'executing' });

    try {
      const executor = new PlanExecutor('anthropic', process.env.ANTHROPIC_API_KEY);
      executor.setRetrievalService({
        retrieve: async (projectId: string, query: string, topK: number) => {
          return retrievalService.retrieve(projectId, query, topK);
        },
      });

      // Apply approved output
      if (resumeFromStepId && approvedOutput) {
        context[resumeFromStepId] = approvedOutput;
      }

      const result = await executor.execute(executionPlan, context);

      await db
        .update(workflowRuns)
        .set({
          status: result.status,
          outputPayload: safeJsonSerialize(result.output),
          finishedAt: new Date(),
          totalTokens: result.totalTokens,
          totalCost: result.totalCost.toString(),
        })
        .where(eq(workflowRuns.id, runId));

      broadcastRunUpdate(runId, {
        status: result.status,
        output: result.output,
        finishedAt: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      await db
        .update(workflowRuns)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Execution failed',
          finishedAt: new Date(),
        })
        .where(eq(workflowRuns.id, runId));

      broadcastRunUpdate(runId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Execution failed',
      });

      throw error;
    }
  },
  { connection }
);

// Worker for document processing
const documentWorker = new Worker(
  'document-processing',
  async (job) => {
    console.log('Processing document job', job.id, job.data);

    return {
      status: 'processed',
      chunks: 5,
    };
  },
  { connection }
);

// Event handlers
workflowInterpretWorker.on('completed', (job) => {
  console.log(`Interpret job ${job.id} completed`);
});

workflowInterpretWorker.on('failed', (job, err) => {
  console.error(`Interpret job ${job?.id} failed`, err);
});

workflowExecutionWorker.on('completed', (job) => {
  console.log(`Execution job ${job.id} completed`);
});

workflowExecutionWorker.on('failed', (job, err) => {
  console.error(`Execution job ${job?.id} failed`, err);
});

workflowContinueWorker.on('completed', (job) => {
  console.log(`Continue job ${job.id} completed`);
});

workflowContinueWorker.on('failed', (job, err) => {
  console.error(`Continue job ${job?.id} failed`, err);
});

documentWorker.on('completed', (job) => {
  console.log(`Document job ${job.id} completed`);
});

documentWorker.on('failed', (job, err) => {
  console.error(`Document job ${job?.id} failed`, err);
});

console.log('Worker service started');
