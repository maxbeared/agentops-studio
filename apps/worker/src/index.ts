import { config } from 'dotenv';
import { Queue, Worker } from 'bullmq';
import { WorkflowEngine } from '@agentops/workflow';

config({ path: '../../.env' });

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

export const workflowQueue = new Queue('workflow-execution', { connection });
export const documentQueue = new Queue('document-processing', { connection });

const workflowEngine = new WorkflowEngine();

const workflowWorker = new Worker(
  'workflow-execution',
  async (job) => {
    console.log('Processing workflow job', job.id, job.data);

    const { definition, input } = job.data;
    const result = await workflowEngine.execute(definition, input || {});

    console.log('Workflow result', result);
    return result;
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
