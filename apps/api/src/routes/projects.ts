import { Hono } from 'hono';
import { createProjectSchema } from '@agentops/shared';

export const projectRoutes = new Hono();

projectRoutes.get('/', async (c) => {
  return c.json({
    data: [
      {
        id: 'demo-project',
        name: 'AgentOps Demo',
        description: 'AI workflow platform demo project',
      },
    ],
  });
});

projectRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  return c.json({
    data: {
      id: crypto.randomUUID(),
      ...parsed.data,
      createdAt: new Date().toISOString(),
    },
  }, 201);
});

projectRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  return c.json({
    data: {
      id,
      name: 'AgentOps Demo',
      description: 'AI workflow platform demo project',
    },
  });
});
