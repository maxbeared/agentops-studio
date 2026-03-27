import { Hono } from 'hono';
import { db } from '@agentops/db';
import { reviewTasks, workflowRuns, workflowNodeRuns, workflowVersions, users } from '@agentops/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Queue } from 'bullmq';

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

const workflowContinueQueue = new Queue('workflow-continue', { connection });

export const reviewRoutes = new Hono();

reviewRoutes.get('/', async (c) => {
  const status = c.req.query('status');

  let tasks: any[];
  if (status) {
    tasks = await db.query.reviewTasks.findMany({
      where: eq(reviewTasks.status, status),
      orderBy: [desc(reviewTasks.createdAt)],
    });
  } else {
    tasks = await db.query.reviewTasks.findMany({
      orderBy: [desc(reviewTasks.createdAt)],
    });
  }

  const tasksWithDetails = await Promise.all(
    tasks.map(async (task) => {
      const run = await db.query.workflowRuns.findFirst({
        where: eq(workflowRuns.id, task.workflowRunId),
      });
      const nodeRun = await db.query.workflowNodeRuns.findFirst({
        where: eq(workflowNodeRuns.id, task.workflowNodeRunId),
      });
      const assignee = task.assigneeUserId
        ? await db.query.users.findFirst({
            where: eq(users.id, task.assigneeUserId),
          })
        : null;

      return {
        id: task.id,
        status: task.status,
        reviewComment: task.reviewComment,
        reviewedOutput: task.reviewedOutput,
        createdAt: task.createdAt,
        reviewedAt: task.reviewedAt,
        workflowRun: run
          ? {
              id: run.id,
              status: run.status,
              outputPayload: run.outputPayload,
            }
          : null,
        nodeRun: nodeRun
          ? {
              id: nodeRun.id,
              nodeKey: nodeRun.nodeKey,
              nodeType: nodeRun.nodeType,
              outputPayload: nodeRun.outputPayload,
            }
          : null,
        assignee: assignee
          ? {
              id: assignee.id,
              name: assignee.name,
              email: assignee.email,
            }
          : null,
      };
    })
  );

  return c.json({
    data: tasksWithDetails,
  });
});

reviewRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const task = await db.query.reviewTasks.findFirst({
    where: eq(reviewTasks.id, id),
  });

  if (!task) {
    return c.json({ error: { formErrors: ['Review task not found'] } }, 404);
  }

  const run = await db.query.workflowRuns.findFirst({
    where: eq(workflowRuns.id, task.workflowRunId),
  });
  const nodeRun = await db.query.workflowNodeRuns.findFirst({
    where: eq(workflowNodeRuns.id, task.workflowNodeRunId),
  });

  return c.json({
    data: {
      id: task.id,
      status: task.status,
      reviewComment: task.reviewComment,
      reviewedOutput: task.reviewedOutput,
      createdAt: task.createdAt,
      reviewedAt: task.reviewedAt,
      workflowRun: run,
      nodeRun: nodeRun,
    },
  });
});

reviewRoutes.post('/:id/approve', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  const task = await db.query.reviewTasks.findFirst({
    where: eq(reviewTasks.id, id),
  });

  if (!task) {
    return c.json({ error: { formErrors: ['Review task not found'] } }, 404);
  }

  if (task.status !== 'pending') {
    return c.json({ error: { formErrors: ['Task has already been reviewed'] } }, 400);
  }

  // Get the full workflow run and version info
  const run = await db.query.workflowRuns.findFirst({
    where: eq(workflowRuns.id, task.workflowRunId),
  });

  if (!run) {
    return c.json({ error: { formErrors: ['Workflow run not found'] } }, 404);
  }

  const version = await db.query.workflowVersions.findFirst({
    where: eq(workflowVersions.id, run.workflowVersionId),
  });

  if (!version) {
    return c.json({ error: { formErrors: ['Workflow version not found'] } }, 404);
  }

  // Get all node runs to reconstruct outputs
  const nodeRuns = await db.query.workflowNodeRuns.findMany({
    where: eq(workflowNodeRuns.workflowRunId, task.workflowRunId),
  });

  // Get the node run for this review task
  const reviewNodeRun = await db.query.workflowNodeRuns.findFirst({
    where: eq(workflowNodeRuns.id, task.workflowNodeRunId),
  });

  if (!reviewNodeRun) {
    return c.json({ error: { formErrors: ['Review node run not found'] } }, 404);
  }

  // Build outputs map from all completed node runs
  const outputs: Record<string, any> = {};
  for (const nodeRun of nodeRuns) {
    if (nodeRun.outputPayload) {
      outputs[nodeRun.nodeKey] = nodeRun.outputPayload;
    }
  }

  // Build execution context for resume
  const context = {
    input: run.inputPayload || {},
    state: task.reviewedOutput || {},
    outputs,
    prevOutputs: {},
  };

  // Use approved output or keep the original
  const approvedOutput = body.output || task.reviewedOutput;

  // Update task status
  await db
    .update(reviewTasks)
    .set({
      status: 'approved',
      reviewComment: body.comment || null,
      reviewedOutput: approvedOutput,
      reviewedAt: new Date(),
    })
    .where(eq(reviewTasks.id, id));

  // Update node run
  await db
    .update(workflowNodeRuns)
    .set({
      status: 'success',
      outputPayload: approvedOutput,
    })
    .where(eq(workflowNodeRuns.id, task.workflowNodeRunId));

  // Add continue job to the queue
  await workflowContinueQueue.add('continue', {
    runId: task.workflowRunId,
    workflowVersionId: run.workflowVersionId,
    definition: version.definition,
    context,
    resumeFromNodeId: reviewNodeRun.nodeKey,
    approvedOutput,
  });

  return c.json({
    data: { id, status: 'approved', message: 'Review approved, workflow continuing' },
  });
});

reviewRoutes.post('/:id/reject', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  const task = await db.query.reviewTasks.findFirst({
    where: eq(reviewTasks.id, id),
  });

  if (!task) {
    return c.json({ error: { formErrors: ['Review task not found'] } }, 404);
  }

  if (task.status !== 'pending') {
    return c.json({ error: { formErrors: ['Task has already been reviewed'] } }, 400);
  }

  await db
    .update(reviewTasks)
    .set({
      status: 'rejected',
      reviewComment: body.comment || null,
      reviewedAt: new Date(),
    })
    .where(eq(reviewTasks.id, id));

  await db
    .update(workflowRuns)
    .set({
      status: 'failed',
      errorMessage: 'Rejected by reviewer',
    })
    .where(eq(workflowRuns.id, task.workflowRunId));

  await db
    .update(workflowNodeRuns)
    .set({
      status: 'failed',
      errorMessage: body.comment || 'Rejected by reviewer',
    })
    .where(eq(workflowNodeRuns.id, task.workflowNodeRunId));

  return c.json({
    data: { id, status: 'rejected', message: 'Review rejected' },
  });
});