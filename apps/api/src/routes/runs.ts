import { Hono } from 'hono';
import { runWorkflowSchema } from '@agentops/shared';
import { db } from '@agentops/db';
import { workflowRuns, workflowVersions, workflows, workflowNodeRuns } from '@agentops/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Queue } from 'bullmq';

const DEMO_USER_ID = 'e8ca6b17-b3f9-447d-9753-0f2632e8fedc';

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

const workflowQueue = new Queue('workflow-execution', { connection });

export const runRoutes = new Hono();

runRoutes.get('/', async (c) => {
  const projectId = c.req.query('projectId');
  const workflowVersionId = c.req.query('workflowVersionId');

  let runs;

  if (workflowVersionId) {
    runs = await db.query.workflowRuns.findMany({
      where: eq(workflowRuns.workflowVersionId, workflowVersionId),
      orderBy: [desc(workflowRuns.createdAt)],
    });
  } else {
    runs = await db.query.workflowRuns.findMany({
      orderBy: [desc(workflowRuns.createdAt)],
    });
  }

  if (projectId) {
    runs = runs.filter((r) => r.projectId === projectId);
  }

  return c.json({
    data: runs.map((r) => ({
      id: r.id,
      workflowVersionId: r.workflowVersionId,
      projectId: r.projectId,
      triggerType: r.triggerType,
      status: r.status,
      totalTokens: r.totalTokens,
      totalCost: r.totalCost,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      createdAt: r.createdAt,
    })),
  });
});

runRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = runWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const version = await db.query.workflowVersions.findFirst({
    where: eq(workflowVersions.id, parsed.data.workflowVersionId),
  });

  if (!version) {
    return c.json({ error: { formErrors: ['Workflow version not found'] } }, 404);
  }

  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, version.workflowId),
  });

  if (!workflow) {
    return c.json({ error: { formErrors: ['Workflow not found'] } }, 404);
  }

  const [run] = await db
    .insert(workflowRuns)
    .values({
      workflowVersionId: parsed.data.workflowVersionId,
      projectId: workflow.projectId,
      triggeredBy: DEMO_USER_ID,
      triggerType: 'api',
      status: 'pending',
      inputPayload: parsed.data.inputPayload || {},
    })
    .returning();

  await workflowQueue.add('execute', {
    runId: run.id,
    workflowVersionId: parsed.data.workflowVersionId,
    definition: version.definition,
    input: parsed.data.inputPayload || {},
  });

  return c.json({
    data: {
      id: run.id,
      workflowVersionId: run.workflowVersionId,
      projectId: run.projectId,
      triggerType: run.triggerType,
      status: run.status,
      inputPayload: run.inputPayload,
      createdAt: run.createdAt,
    },
  }, 201);
});

runRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const run = await db.query.workflowRuns.findFirst({
    where: eq(workflowRuns.id, id),
  });

  if (!run) {
    return c.json({ error: { formErrors: ['Run not found'] } }, 404);
  }

  return c.json({
    data: {
      id: run.id,
      workflowVersionId: run.workflowVersionId,
      projectId: run.projectId,
      triggerType: run.triggerType,
      status: run.status,
      inputPayload: run.inputPayload,
      outputPayload: run.outputPayload,
      totalTokens: run.totalTokens,
      totalCost: run.totalCost,
      errorMessage: run.errorMessage,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      createdAt: run.createdAt,
    },
  });
});

runRoutes.get('/:id/nodes', async (c) => {
  const id = c.req.param('id');

  const nodeRuns = await db.query.workflowNodeRuns.findMany({
    where: eq(workflowNodeRuns.workflowRunId, id),
  });

  return c.json({
    data: {
      runId: id,
      nodes: nodeRuns.map((n) => ({
        nodeKey: n.nodeKey,
        nodeType: n.nodeType,
        status: n.status,
        inputPayload: n.inputPayload,
        outputPayload: n.outputPayload,
        errorMessage: n.errorMessage,
        startedAt: n.startedAt,
        finishedAt: n.finishedAt,
        durationMs: n.durationMs,
        tokenUsageInput: n.tokenUsageInput,
        tokenUsageOutput: n.tokenUsageOutput,
        cost: n.cost,
      })),
    },
  });
});