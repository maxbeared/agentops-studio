import { config } from 'dotenv';
import { Worker } from 'bullmq';
import { WorkflowEngine } from '@agentops/workflow';
import { db } from '@agentops/db';
import { workflowRuns, workflowVersions, workflowNodeRuns } from '@agentops/db/schema';
import { eq } from 'drizzle-orm';

config({ path: '../../.env' });

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

const workflowEngine = new WorkflowEngine();

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