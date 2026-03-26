import { Hono } from 'hono';
import { createKnowledgeDocumentSchema } from '@agentops/shared';

export const knowledgeRoutes = new Hono();

knowledgeRoutes.get('/', async (c) => {
  return c.json({
    data: [
      {
        id: 'doc-1',
        title: 'Product Strategy 2026',
        sourceType: 'file',
        status: 'ready',
      },
    ],
  });
});

knowledgeRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createKnowledgeDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  return c.json({
    data: {
      id: crypto.randomUUID(),
      ...parsed.data,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
    },
  }, 201);
});

knowledgeRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  return c.json({
    data: {
      id,
      title: 'Product Strategy 2026',
      sourceType: 'file',
      status: 'ready',
      chunks: 12,
    },
  });
});
