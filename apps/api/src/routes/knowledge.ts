import { Hono } from 'hono';
import { createKnowledgeDocumentSchema } from '@agentops/shared';
import { db } from '@agentops/db';
import { knowledgeDocuments, knowledgeChunks } from '@agentops/db/schema';
import { eq, desc } from 'drizzle-orm';

const DEMO_USER_ID = 'e8ca6b17-b3f9-447d-9753-0f2632e8fedc';

export const knowledgeRoutes = new Hono();

knowledgeRoutes.get('/', async (c) => {
  const projectId = c.req.query('projectId');

  let docs;

  if (projectId) {
    docs = await db.query.knowledgeDocuments.findMany({
      where: eq(knowledgeDocuments.projectId, projectId),
      orderBy: [desc(knowledgeDocuments.createdAt)],
    });
  } else {
    docs = await db.query.knowledgeDocuments.findMany({
      orderBy: [desc(knowledgeDocuments.createdAt)],
    });
  }

  return c.json({
    data: docs.map((doc) => ({
      id: doc.id,
      projectId: doc.projectId,
      title: doc.title,
      sourceType: doc.sourceType,
      sourceUrl: doc.sourceUrl,
      mimeType: doc.mimeType,
      status: doc.status,
      version: doc.version,
      createdAt: doc.createdAt,
    })),
  });
});

knowledgeRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createKnowledgeDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const [doc] = await db
    .insert(knowledgeDocuments)
    .values({
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      sourceType: parsed.data.sourceType,
      sourceUrl: parsed.data.sourceUrl,
      mimeType: parsed.data.mimeType,
      status: 'uploaded',
      createdBy: DEMO_USER_ID,
    })
    .returning();

  return c.json({
    data: {
      id: doc.id,
      projectId: doc.projectId,
      title: doc.title,
      sourceType: doc.sourceType,
      sourceUrl: doc.sourceUrl,
      mimeType: doc.mimeType,
      status: doc.status,
      version: doc.version,
      createdAt: doc.createdAt,
    },
  }, 201);
});

knowledgeRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const doc = await db.query.knowledgeDocuments.findFirst({
    where: eq(knowledgeDocuments.id, id),
  });

  if (!doc) {
    return c.json({ error: { formErrors: ['Document not found'] } }, 404);
  }

  const chunks = await db.query.knowledgeChunks.findMany({
    where: eq(knowledgeChunks.documentId, id),
  });

  return c.json({
    data: {
      id: doc.id,
      projectId: doc.projectId,
      title: doc.title,
      sourceType: doc.sourceType,
      sourceUrl: doc.sourceUrl,
      mimeType: doc.mimeType,
      status: doc.status,
      version: doc.version,
      chunksCount: chunks.length,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
  });
});