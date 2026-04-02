import { Hono } from 'hono';
import { db } from '@agentops/db';
import { aiModelConfigs } from '@agentops/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUser } from '../lib/auth';
import { z } from 'zod';

export const aiModelConfigRoutes = new Hono();

// Schema for validation
const createModelConfigSchema = z.object({
  name: z.string().min(1).max(50),
  provider: z.enum(['openai', 'anthropic', 'custom']),
  apiEndpoint: z.string().optional(),
  apiKey: z.string().optional(),
  defaultModel: z.string().min(1).max(50),
  isDefault: z.boolean().optional().default(false),
});

const updateModelConfigSchema = createModelConfigSchema.partial();

// List all AI model configs for the organization
aiModelConfigRoutes.get('/', async (c) => {
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const configs = await db.query.aiModelConfigs.findMany({
    where: eq(aiModelConfigs.orgId, authUser.orgId!),
  });

  return c.json({
    data: configs.map((config) => ({
      id: config.id,
      orgId: config.orgId,
      name: config.name,
      provider: config.provider,
      apiEndpoint: config.apiEndpoint,
      apiKey: config.apiKey ? '***' : null, // Mask API key
      defaultModel: config.defaultModel,
      isDefault: config.isDefault,
      createdAt: config.createdAt,
    })),
  });
});

// Get a specific config
aiModelConfigRoutes.get('/:id', async (c) => {
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const id = c.req.param('id');

  const config = await db.query.aiModelConfigs.findFirst({
    where: and(eq(aiModelConfigs.id, id), eq(aiModelConfigs.orgId, authUser.orgId!)),
  });

  if (!config) {
    return c.json({ error: { formErrors: ['Config not found'] } }, 404);
  }

  return c.json({
    data: {
      id: config.id,
      orgId: config.orgId,
      name: config.name,
      provider: config.provider,
      apiEndpoint: config.apiEndpoint,
      apiKey: config.apiKey ? '***' : null,
      defaultModel: config.defaultModel,
      isDefault: config.isDefault,
      createdAt: config.createdAt,
    },
  });
});

// Create a new config
aiModelConfigRoutes.post('/', async (c) => {
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const body = await c.req.json();
  const parsed = createModelConfigSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  // If this is set as default, unset other defaults
  if (parsed.data.isDefault) {
    await db
      .update(aiModelConfigs)
      .set({ isDefault: false })
      .where(eq(aiModelConfigs.orgId, authUser.orgId!));
  }

  const [config] = await db
    .insert(aiModelConfigs)
    .values({
      orgId: authUser.orgId!,
      name: parsed.data.name,
      provider: parsed.data.provider,
      apiEndpoint: parsed.data.apiEndpoint,
      apiKey: parsed.data.apiKey,
      defaultModel: parsed.data.defaultModel,
      isDefault: parsed.data.isDefault ?? false,
    })
    .returning();

  return c.json({
    data: {
      id: config.id,
      orgId: config.orgId,
      name: config.name,
      provider: config.provider,
      apiEndpoint: config.apiEndpoint,
      apiKey: config.apiKey ? '***' : null,
      defaultModel: config.defaultModel,
      isDefault: config.isDefault,
      createdAt: config.createdAt,
    },
  }, 201);
});

// Update a config
aiModelConfigRoutes.put('/:id', async (c) => {
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateModelConfigSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  // Check if config exists and belongs to org
  const existing = await db.query.aiModelConfigs.findFirst({
    where: and(eq(aiModelConfigs.id, id), eq(aiModelConfigs.orgId, authUser.orgId!)),
  });

  if (!existing) {
    return c.json({ error: { formErrors: ['Config not found'] } }, 404);
  }

  // If setting as default, unset other defaults
  if (parsed.data.isDefault) {
    await db
      .update(aiModelConfigs)
      .set({ isDefault: false })
      .where(eq(aiModelConfigs.orgId, authUser.orgId!));
  }

  const [config] = await db
    .update(aiModelConfigs)
    .set({
      name: parsed.data.name,
      provider: parsed.data.provider,
      apiEndpoint: parsed.data.apiEndpoint,
      apiKey: parsed.data.apiKey,
      defaultModel: parsed.data.defaultModel,
      isDefault: parsed.data.isDefault,
    })
    .where(eq(aiModelConfigs.id, id))
    .returning();

  return c.json({
    data: {
      id: config.id,
      orgId: config.orgId,
      name: config.name,
      provider: config.provider,
      apiEndpoint: config.apiEndpoint,
      apiKey: config.apiKey ? '***' : null,
      defaultModel: config.defaultModel,
      isDefault: config.isDefault,
      createdAt: config.createdAt,
    },
  });
});

// Delete a config
aiModelConfigRoutes.delete('/:id', async (c) => {
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const id = c.req.param('id');

  const existing = await db.query.aiModelConfigs.findFirst({
    where: and(eq(aiModelConfigs.id, id), eq(aiModelConfigs.orgId, authUser.orgId!)),
  });

  if (!existing) {
    return c.json({ error: { formErrors: ['Config not found'] } }, 404);
  }

  await db.delete(aiModelConfigs).where(eq(aiModelConfigs.id, id));

  return c.json({ data: { success: true } });
});

// Get default config
aiModelConfigRoutes.get('/default', async (c) => {
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const config = await db.query.aiModelConfigs.findFirst({
    where: and(eq(aiModelConfigs.orgId, authUser.orgId!), eq(aiModelConfigs.isDefault, true)),
  });

  if (!config) {
    return c.json({ data: null });
  }

  return c.json({
    data: {
      id: config.id,
      orgId: config.orgId,
      name: config.name,
      provider: config.provider,
      apiEndpoint: config.apiEndpoint,
      apiKey: config.apiKey ? '***' : null,
      defaultModel: config.defaultModel,
      isDefault: config.isDefault,
      createdAt: config.createdAt,
    },
  });
});
