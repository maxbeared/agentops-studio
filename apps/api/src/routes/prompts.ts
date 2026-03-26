import { Hono } from 'hono';
import { db } from '@agentops/db';
import { promptTemplates } from '@agentops/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const DEMO_USER_ID = 'e8ca6b17-b3f9-447d-9753-0f2632e8fedc';

export const promptRoutes = new Hono();

const createPromptSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  template: z.string().min(1),
  inputSchema: z.record(z.any()).optional(),
});

const updatePromptSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  template: z.string().min(1).optional(),
  inputSchema: z.record(z.any()).optional(),
});

promptRoutes.get('/', async (c) => {
  const projectId = c.req.query('projectId');

  let prompts;
  if (projectId) {
    prompts = await db.query.promptTemplates.findMany({
      where: eq(promptTemplates.projectId, projectId),
      orderBy: [desc(promptTemplates.createdAt)],
    });
  } else {
    prompts = await db.query.promptTemplates.findMany({
      orderBy: [desc(promptTemplates.createdAt)],
    });
  }

  return c.json({
    data: prompts.map((p) => ({
      id: p.id,
      projectId: p.projectId,
      name: p.name,
      description: p.description,
      template: p.template,
      inputSchema: p.inputSchema,
      version: p.version,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  });
});

promptRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createPromptSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const [prompt] = await db
    .insert(promptTemplates)
    .values({
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      description: parsed.data.description,
      template: parsed.data.template,
      inputSchema: parsed.data.inputSchema,
      createdBy: DEMO_USER_ID,
    })
    .returning();

  return c.json({
    data: {
      id: prompt.id,
      projectId: prompt.projectId,
      name: prompt.name,
      description: prompt.description,
      template: prompt.template,
      inputSchema: prompt.inputSchema,
      version: prompt.version,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    },
  }, 201);
});

promptRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const prompt = await db.query.promptTemplates.findFirst({
    where: eq(promptTemplates.id, id),
  });

  if (!prompt) {
    return c.json({ error: { formErrors: ['Prompt template not found'] } }, 404);
  }

  return c.json({
    data: {
      id: prompt.id,
      projectId: prompt.projectId,
      name: prompt.name,
      description: prompt.description,
      template: prompt.template,
      inputSchema: prompt.inputSchema,
      version: prompt.version,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    },
  });
});

promptRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updatePromptSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const existing = await db.query.promptTemplates.findFirst({
    where: eq(promptTemplates.id, id),
  });

  if (!existing) {
    return c.json({ error: { formErrors: ['Prompt template not found'] } }, 404);
  }

  const [prompt] = await db
    .update(promptTemplates)
    .set({
      ...parsed.data,
      version: existing.version + 1,
    })
    .where(eq(promptTemplates.id, id))
    .returning();

  return c.json({
    data: {
      id: prompt.id,
      projectId: prompt.projectId,
      name: prompt.name,
      description: prompt.description,
      template: prompt.template,
      inputSchema: prompt.inputSchema,
      version: prompt.version,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    },
  });
});

promptRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await db.query.promptTemplates.findFirst({
    where: eq(promptTemplates.id, id),
  });

  if (!existing) {
    return c.json({ error: { formErrors: ['Prompt template not found'] } }, 404);
  }

  await db.delete(promptTemplates).where(eq(promptTemplates.id, id));

  return c.json({
    data: { id, message: 'Deleted successfully' },
  });
});
