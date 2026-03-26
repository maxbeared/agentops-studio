import { Hono } from 'hono';
import { createWorkflowSchema, publishWorkflowSchema } from '@agentops/shared';
import { db } from '@agentops/db';
import { workflows, workflowVersions, workflowNodes, workflowEdges } from '@agentops/db/schema';
import { eq, desc } from 'drizzle-orm';

const DEMO_USER_ID = 'e8ca6b17-b3f9-447d-9753-0f2632e8fedc';

export const workflowRoutes = new Hono();

workflowRoutes.get('/', async (c) => {
  const projectId = c.req.query('projectId');

  let workflowList: any[];

  if (projectId) {
    workflowList = await db.query.workflows.findMany({
      where: eq(workflows.projectId, projectId),
      orderBy: [desc(workflows.createdAt)],
    });
  } else {
    workflowList = await db.query.workflows.findMany({
      orderBy: [desc(workflows.createdAt)],
    });
  }

  return c.json({
    data: workflowList.map((w) => ({
      id: w.id,
      projectId: w.projectId,
      name: w.name,
      description: w.description,
      status: w.status,
      latestVersionId: w.latestVersionId,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    })),
  });
});

workflowRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const [workflow] = await db
    .insert(workflows)
    .values({
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      description: parsed.data.description,
      createdBy: DEMO_USER_ID,
      status: 'draft',
    })
    .returning();

  return c.json({
    data: {
      id: workflow.id,
      projectId: workflow.projectId,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    },
  }, 201);
});

workflowRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, id),
  });

  if (!workflow) {
    return c.json({ error: { formErrors: ['Workflow not found'] } }, 404);
  }

  let version = null;
  if (workflow.latestVersionId) {
    version = await db.query.workflowVersions.findFirst({
      where: eq(workflowVersions.id, workflow.latestVersionId),
    });
  }

  let nodes: any[] = [];
  let edges: any[] = [];

  if (version) {
    const nodeRecords = await db.query.workflowNodes.findMany({
      where: eq(workflowNodes.workflowVersionId, version.id),
    });
    const edgeRecords = await db.query.workflowEdges.findMany({
      where: eq(workflowEdges.workflowVersionId, version.id),
    });
    nodes = nodeRecords.map((n) => ({
      id: n.nodeKey,
      key: n.nodeKey,
      type: n.nodeType,
      name: n.name,
      config: n.config,
      position: { x: n.positionX, y: n.positionY },
    }));
    edges = edgeRecords.map((e) => ({
      id: e.id,
      source: e.sourceNodeKey,
      target: e.targetNodeKey,
      condition: e.conditionConfig,
    }));
  }

  return c.json({
    data: {
      id: workflow.id,
      projectId: workflow.projectId,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      latestVersion: version ? version.version : null,
      latestVersionId: workflow.latestVersionId,
      definition: version ? { nodes, edges } : null,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
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

  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, id),
  });

  if (!workflow) {
    return c.json({ error: { formErrors: ['Workflow not found'] } }, 404);
  }

  const existingVersions = await db.query.workflowVersions.findMany({
    where: eq(workflowVersions.workflowId, id),
    orderBy: [desc(workflowVersions.version)],
    limit: 1,
  });

  const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

  const [version] = await db
    .insert(workflowVersions)
    .values({
      workflowId: id,
      version: nextVersion,
      definition: parsed.data.definition,
      publishedAt: new Date(),
      createdBy: DEMO_USER_ID,
    })
    .returning();

  if (parsed.data.definition.nodes && parsed.data.definition.nodes.length > 0) {
    for (const node of parsed.data.definition.nodes) {
      const nodeKey = node.id || node.key || `node_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(workflowNodes).values({
        workflowVersionId: version.id,
        nodeKey,
        nodeType: node.type,
        name: node.name || node.label || node.type,
        config: node.config || {},
        positionX: node.position?.x || 0,
        positionY: node.position?.y || 0,
      });
    }
  }

  if (parsed.data.definition.edges && parsed.data.definition.edges.length > 0) {
    for (const edge of parsed.data.definition.edges) {
      await db.insert(workflowEdges).values({
        workflowVersionId: version.id,
        sourceNodeKey: edge.source,
        targetNodeKey: edge.target,
        conditionConfig: edge.condition,
      });
    }
  }

  await db
    .update(workflows)
    .set({
      status: 'published',
      latestVersionId: version.id,
      updatedAt: new Date(),
    })
    .where(eq(workflows.id, id));

  return c.json({
    data: {
      id,
      versionId: version.id,
      version: version.version,
      publishedAt: version.publishedAt,
    },
  });
});