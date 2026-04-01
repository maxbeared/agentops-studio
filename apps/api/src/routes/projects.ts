import { Hono } from 'hono';
import { createProjectSchema, updateProjectSchema } from '@agentops/shared';
import { db } from '@agentops/db';
import { projects, organizations } from '@agentops/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '../lib/auth';

export const projectRoutes = new Hono();

projectRoutes.get('/', async (c) => {
  const authUser = await getAuthUser(c);
  const queryOrgId = c.req.query('organizationId');
  
  let orgId = queryOrgId;
  if (!orgId && authUser) {
    orgId = authUser.orgId || undefined;
  }
  
  if (!orgId) {
    return c.json({ data: [] });
  }

  const projectList = await db.query.projects.findMany({
    where: eq(projects.organizationId, orgId),
    with: {
      organization: true,
    },
  });

  return c.json({
    data: projectList.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      organizationId: p.organizationId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  });
});

projectRoutes.post('/', async (c) => {
  const authUser = await getAuthUser(c);
  
  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const body = await c.req.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const orgId = parsed.data.organizationId || authUser.orgId;

  if (!orgId) {
    return c.json({ error: { formErrors: ['Organization ID required'] } }, 400);
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  if (!org) {
    return c.json({ error: { formErrors: ['Organization not found'] } }, 404);
  }

  const [project] = await db
    .insert(projects)
    .values({
      organizationId: orgId,
      name: parsed.data.name,
      description: parsed.data.description,
      createdBy: authUser.userId,
    })
    .returning();

  return c.json({
    data: {
      id: project.id,
      name: project.name,
      description: project.description,
      organizationId: project.organizationId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
  }, 201);
});

projectRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      organization: true,
    },
  });

  if (!project) {
    return c.json({ error: { formErrors: ['Project not found'] } }, 404);
  }

  return c.json({
    data: {
      id: project.id,
      name: project.name,
      description: project.description,
      organizationId: project.organizationId,
      organization: {
        id: project.organization.id,
        name: project.organization.name,
        slug: project.organization.slug,
      },
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
  });
});

projectRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  if (!project) {
    return c.json({ error: { formErrors: ['Project not found'] } }, 404);
  }

  const body = await c.req.json();
  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const [updated] = await db
    .update(projects)
    .set({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  return c.json({
    data: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      organizationId: updated.organizationId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
});

projectRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  if (!project) {
    return c.json({ error: { formErrors: ['Project not found'] } }, 404);
  }

  await db.delete(projects).where(eq(projects.id, id));

  return c.json({ data: { success: true } });
});