import { Hono } from 'hono';
import { runWorkflowSchema } from '@agentops/shared';

export const runRoutes = new Hono();

runRoutes.get('/', async (c) => {
  return c.json({
    data: [
      {
        id: 'run-1',
        workflowVersionId: 'version-1',
        status: 'success',
        totalTokens: 1280,
        totalCost: 0.0184,
      },
    ],
  });
});

runRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = runWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  return c.json({
    data: {
      id: crypto.randomUUID(),
      ...parsed.data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  }, 201);
});

runRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  return c.json({
    data: {
      id,
      status: 'success',
      totalTokens: 1280,
      totalCost: 0.0184,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    },
  });
});

runRoutes.get('/:id/nodes', async (c) => {
  const id = c.req.param('id');
  return c.json({
    data: {
      runId: id,
      nodes: [
        { nodeKey: 'start-1', status: 'success' },
        { nodeKey: 'retrieval-1', status: 'success' },
        { nodeKey: 'llm-1', status: 'success' },
        { nodeKey: 'output-1', status: 'success' },
      ],
    },
  });
});
