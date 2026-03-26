import { Hono } from 'hono';
import { createWorkflowSchema, publishWorkflowSchema } from '@agentops/shared';

export const workflowRoutes = new Hono();

workflowRoutes.get('/', async (c) => {
  return c.json({
    data: [
      {
        id: 'wf-1',
        name: 'Weekly Report Generator',
        status: 'published',
        latestVersion: 2,
      },
    ],
  });
});

workflowRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  return c.json({
    data: {
      id: crypto.randomUUID(),
      ...parsed.data,
      status: 'draft',
      createdAt: new Date().toISOString(),
    },
  }, 201);
});

workflowRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  return c.json({
    data: {
      id,
      name: 'Weekly Report Generator',
      status: 'published',
      latestVersion: 2,
    },
  });
});

workflowRoutes.post('/:id/publish', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = publishWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  return c.json({
    data: {
      id,
      versionId: crypto.randomUUID(),
      version: 3,
      publishedAt: new Date().toISOString(),
    },
  });
});
