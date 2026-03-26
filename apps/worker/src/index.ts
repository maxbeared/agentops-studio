import { config } from 'dotenv';
import { Worker } from 'bullmq';
import { WorkflowEngine } from '@agentops/workflow';
import type { NodeExecutionResult } from '@agentops/workflow';
import { db } from '@agentops/db';
import { workflowRuns, workflowNodeRuns } from '@agentops/db/schema';
import { eq } from 'drizzle-orm';

config({ path: '../../.env' });

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

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

    const workflowEngine = new WorkflowEngine();

    workflowEngine.setNodeExecutionListener(async (nodeKey, nodeType, status, result?: NodeExecutionResult) => {
      try {
        const existing = await db.query.workflowNodeRuns.findFirst({
          where: eq(workflowNodeRuns.workflowRunId, runId),
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
        } else {
          await db.insert(workflowNodeRuns).values({
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

workflowWorker.on('completed', (job) => {
  console.log(`Workflow job ${job.id} completed`);
});

workflowWorker.on('failed', (job, err) => {
  console.error(`Workflow job ${job?.id} failed`, err);
});

documentWorker.on('completed', (job) => {
  console.log(`Document job ${job.id} completed`);
});

documentWorker.on('failed', (job, err) => {
  console.error(`Document job ${job?.id} failed`, err);
});

console.log('Worker service started');