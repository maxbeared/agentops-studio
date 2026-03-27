import { config } from 'dotenv';
import { Worker } from 'bullmq';
import { WorkflowEngine, type RetrievalService } from '@agentops/workflow';
import type { NodeExecutionResult } from '@agentops/workflow';
import { db } from '@agentops/db';
import { workflowRuns, workflowNodeRuns, knowledgeChunks, reviewTasks } from '@agentops/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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

const workflowWorker = new Worker(
  'workflow-execution',
  async (job) => {
    console.log('Processing workflow job', job.id, job.data);

    const { runId, workflowVersionId, definition, input } = job.data;

    await db
      .update(workflowRuns)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(workflowRuns.id, runId));

    broadcastRunUpdate(runId, { status: 'running', startedAt: new Date().toISOString() });

    const workflowEngine = new WorkflowEngine();
    workflowEngine.setRetrievalService(retrievalService);

    workflowEngine.setNodeExecutionListener(async (nodeKey, nodeType, status, result?: NodeExecutionResult) => {
      try {
        // Find this node's definition to get config
        const nodeDef = definition.nodes.find((n: any) => n.id === nodeKey);
        const nodeConfig = nodeDef?.config || {};

        let nodeRunId: string | null = null;

        const existing = await db.query.workflowNodeRuns.findFirst({
          where: and(
            eq(workflowNodeRuns.workflowRunId, runId),
            eq(workflowNodeRuns.nodeKey, nodeKey)
          ),
        });

        if (existing) {
          await db
            .update(workflowNodeRuns)
            .set({
              status,
              outputPayload: result?.output ? safeJsonSerialize(result.output) : undefined,
              errorMessage: result?.errorMessage,
              finishedAt: new Date(),
              durationMs: result?.latencyMs,
              tokenUsageInput: result?.usage?.inputTokens,
              tokenUsageOutput: result?.usage?.outputTokens,
              cost: result?.usage?.cost?.toString(),
            })
            .where(eq(workflowNodeRuns.id, existing.id));
          nodeRunId = existing.id;
        } else {
          const [inserted] = await db.insert(workflowNodeRuns).values({
            workflowRunId: runId,
            nodeKey,
            nodeType,
            status,
            inputPayload: safeJsonSerialize(input || {}),
            outputPayload: result?.output ? safeJsonSerialize(result.output) : undefined,
            errorMessage: result?.errorMessage,
            startedAt: new Date(),
            finishedAt: new Date(),
            durationMs: result?.latencyMs,
            tokenUsageInput: result?.usage?.inputTokens || 0,
            tokenUsageOutput: result?.usage?.outputTokens || 0,
            cost: result?.usage?.cost?.toString() || '0',
          }).returning();
          nodeRunId = inserted.id;
        }

        // Create review task when review node pauses for approval
        if (nodeType === 'review' && status === 'waiting_review' && nodeRunId) {
          await db.insert(reviewTasks).values({
            workflowRunId: runId,
            workflowNodeRunId: nodeRunId,
            assigneeUserId: nodeConfig.assigneeUserId || null,
            status: 'pending',
            reviewedOutput: result?.output ? safeJsonSerialize(result.output) : undefined,
          });

          broadcastRunUpdate(runId, {
            nodeKey,
            nodeType,
            status,
            reviewTaskCreated: true,
            result: result ? {
              output: result.output,
              errorMessage: result.errorMessage,
              latencyMs: result.latencyMs,
            } : undefined,
          });
        } else {
          broadcastRunUpdate(runId, {
            nodeKey,
            nodeType,
            status,
            result: result ? {
              output: result.output,
              errorMessage: result.errorMessage,
              latencyMs: result.latencyMs,
            } : undefined,
          });
        }
      } catch (err) {
        console.error('Failed to record node run:', err);
      }
    });

    try {
      const safeInput = safeJsonSerialize(input || {});
      const result = await workflowEngine.execute(definition, safeInput);

      await db
        .update(workflowRuns)
        .set({
          status: result.status,
          outputPayload: safeJsonSerialize(result.outputs || {}),
          finishedAt: new Date(),
        })
        .where(eq(workflowRuns.id, runId));

      broadcastRunUpdate(runId, {
        status: result.status,
        output: result.outputs,
        finishedAt: new Date().toISOString(),
      });

      console.log('Workflow result', result);
      return result;
    } catch (error) {
      await db
        .update(workflowRuns)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          finishedAt: new Date(),
        })
        .where(eq(workflowRuns.id, runId));

      broadcastRunUpdate(runId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        finishedAt: new Date().toISOString(),
      });

      throw error;
    }
  },
  { connection }
);

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

// Worker for continuing workflow execution after review approval
const workflowContinueWorker = new Worker(
  'workflow-continue',
  async (job) => {
    console.log('Processing workflow continue job', job.id, job.data);

    const { runId, workflowVersionId, definition, context, resumeFromNodeId, approvedOutput } = job.data;

    await db
      .update(workflowRuns)
      .set({ status: 'running' })
      .where(eq(workflowRuns.id, runId));

    broadcastRunUpdate(runId, { status: 'running' });

    const workflowEngine = new WorkflowEngine();
    workflowEngine.setRetrievalService(retrievalService);

    // Set up the same listener for node execution tracking
    workflowEngine.setNodeExecutionListener(async (nodeKey, nodeType, status, result?: NodeExecutionResult) => {
      try {
        const nodeDef = definition.nodes.find((n: any) => n.id === nodeKey);
        const nodeConfig = nodeDef?.config || {};

        let nodeRunId: string | null = null;

        const existing = await db.query.workflowNodeRuns.findFirst({
          where: and(
            eq(workflowNodeRuns.workflowRunId, runId),
            eq(workflowNodeRuns.nodeKey, nodeKey)
          ),
        });

        if (existing) {
          await db
            .update(workflowNodeRuns)
            .set({
              status,
              outputPayload: result?.output ? safeJsonSerialize(result.output) : undefined,
              errorMessage: result?.errorMessage,
              finishedAt: new Date(),
              durationMs: result?.latencyMs,
              tokenUsageInput: result?.usage?.inputTokens,
              tokenUsageOutput: result?.usage?.outputTokens,
              cost: result?.usage?.cost?.toString(),
            })
            .where(eq(workflowNodeRuns.id, existing.id));
          nodeRunId = existing.id;
        } else {
          const [inserted] = await db.insert(workflowNodeRuns).values({
            workflowRunId: runId,
            nodeKey,
            nodeType,
            status,
            outputPayload: result?.output ? safeJsonSerialize(result.output) : undefined,
            errorMessage: result?.errorMessage,
            startedAt: new Date(),
            finishedAt: new Date(),
            durationMs: result?.latencyMs,
            tokenUsageInput: result?.usage?.inputTokens || 0,
            tokenUsageOutput: result?.usage?.outputTokens || 0,
            cost: result?.usage?.cost?.toString() || '0',
          }).returning();
          nodeRunId = inserted.id;
        }

        broadcastRunUpdate(runId, {
          nodeKey,
          nodeType,
          status,
          result: result ? {
            output: result.output,
            errorMessage: result.errorMessage,
            latencyMs: result.latencyMs,
          } : undefined,
        });
      } catch (err) {
        console.error('Failed to record node run:', err);
      }
    });

    try {
      // The context is already a plain object from the job data (JSON serialized/deserialized by BullMQ)
      // Apply approved output to the review node's output
      if (approvedOutput && context.outputs) {
        context.outputs[resumeFromNodeId] = approvedOutput;
      }

      const result = await workflowEngine.executeFrom(definition, resumeFromNodeId, context);

      await db
        .update(workflowRuns)
        .set({
          status: result.status,
          outputPayload: safeJsonSerialize(result.outputs || {}),
          finishedAt: new Date(),
        })
        .where(eq(workflowRuns.id, runId));

      broadcastRunUpdate(runId, {
        status: result.status,
        output: result.outputs,
        finishedAt: new Date().toISOString(),
      });

      console.log('Workflow continue result', result);
      return result;
    } catch (error) {
      await db
        .update(workflowRuns)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          finishedAt: new Date(),
        })
        .where(eq(workflowRuns.id, runId));

      broadcastRunUpdate(runId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        finishedAt: new Date().toISOString(),
      });

      throw error;
    }
  },
  { connection }
);

workflowWorker.on('completed', (job) => {
  console.log(`Workflow job ${job.id} completed`);
});

workflowWorker.on('failed', (job, err) => {
  console.error(`Workflow job ${job?.id} failed`, err);
});

workflowContinueWorker.on('completed', (job) => {
  console.log(`Workflow continue job ${job.id} completed`);
});

workflowContinueWorker.on('failed', (job, err) => {
  console.error(`Workflow continue job ${job?.id} failed`, err);
});

documentWorker.on('completed', (job) => {
  console.log(`Document job ${job.id} completed`);
});

documentWorker.on('failed', (job, err) => {
  console.error(`Document job ${job?.id} failed`, err);
});

console.log('Worker service started');