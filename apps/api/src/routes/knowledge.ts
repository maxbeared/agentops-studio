import { Hono } from 'hono';
import { createKnowledgeDocumentSchema } from '@agentops/shared';
import { db } from '@agentops/db';
import { knowledgeDocuments, knowledgeChunks } from '@agentops/db/schema';
import { eq, desc } from 'drizzle-orm';
import { uploadFile, getFileUrl } from '../lib/minio';
import { getAuthUser } from '../lib/auth';
import { createLLMProvider } from '@agentops/ai';

export const knowledgeRoutes = new Hono();

knowledgeRoutes.get('/', async (c) => {
  const projectId = c.req.query('projectId');

  let docs: any[];

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
      fileKey: doc.fileKey,
      mimeType: doc.mimeType,
      status: doc.status,
      version: doc.version,
      createdAt: doc.createdAt,
    })),
  });
});

knowledgeRoutes.post('/upload', async (c) => {
  const authUser = await getAuthUser(c);
  
  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;
    const title = formData.get('title') as string | null;

    if (!file || !projectId || !title) {
      return c.json({ error: { formErrors: ['Missing required fields: file, projectId, title'] } }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileKey = await uploadFile(file.name, buffer, file.type || 'application/octet-stream');

    const [doc] = await db
      .insert(knowledgeDocuments)
      .values({
        projectId,
        title,
        sourceType: 'file',
        fileKey,
        mimeType: file.type || 'application/octet-stream',
        status: 'uploaded',
        createdBy: authUser.userId,
      })
      .returning();

    return c.json({
      data: {
        id: doc.id,
        projectId: doc.projectId,
        title: doc.title,
        sourceType: doc.sourceType,
        fileKey: doc.fileKey,
        mimeType: doc.mimeType,
        status: doc.status,
        version: doc.version,
        createdAt: doc.createdAt,
      },
    }, 201);
  } catch (err) {
    console.error('Upload error:', err);
    return c.json({ error: { formErrors: ['Upload failed'] } }, 500);
  }
});

knowledgeRoutes.post('/', async (c) => {
  const authUser = await getAuthUser(c);
  
  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

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
      createdBy: authUser.userId,
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

  let sourceUrl = doc.sourceUrl;
  if (doc.fileKey) {
    try {
      sourceUrl = await getFileUrl(doc.fileKey);
    } catch {
      sourceUrl = doc.fileKey;
    }
  }

  return c.json({
    data: {
      id: doc.id,
      projectId: doc.projectId,
      title: doc.title,
      sourceType: doc.sourceType,
      sourceUrl,
      mimeType: doc.mimeType,
      status: doc.status,
      version: doc.version,
      chunksCount: chunks.length,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
  });
});

knowledgeRoutes.post('/:id/process', async (c) => {
  const id = c.req.param('id');

  const doc = await db.query.knowledgeDocuments.findFirst({
    where: eq(knowledgeDocuments.id, id),
  });

  if (!doc) {
    return c.json({ error: { formErrors: ['Document not found'] } }, 404);
  }

  await db
    .update(knowledgeDocuments)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(knowledgeDocuments.id, id));

  // Create OpenAI provider for embeddings
  const provider = createLLMProvider('openai', process.env.OPENAI_API_KEY);

  if (doc.fileKey) {
    // For file-based documents, create chunks from the title/filename
    // In production, you would parse the file content (PDF, TXT, etc.)
    const chunks = doc.title.split(/\s+/).filter(Boolean);
    const sampleChunks = [];
    for (let i = 0; i < Math.min(chunks.length, 5); i++) {
      const content = chunks.slice(i * 3, i * 3 + 3).join(' ') || doc.title;

      // Generate real embedding for this chunk
      let embeddingJson: string | null = null;
      try {
        if (provider.embed) {
          const embeddingResult = await provider.embed({ text: content });
          embeddingJson = JSON.stringify(embeddingResult.vector);
        }
      } catch (err) {
        console.error('Failed to generate embedding:', err);
      }

      sampleChunks.push({
        documentId: id,
        projectId: doc.projectId,
        chunkIndex: i,
        content,
        metadata: {},
        embedding: embeddingJson,
      });
    }

    if (sampleChunks.length > 0) {
      for (const chunk of sampleChunks) {
        await db.insert(knowledgeChunks).values(chunk);
      }
    }
  } else if (doc.sourceUrl) {
    // For URL-based documents
    let embeddingJson: string | null = null;
    try {
      if (provider.embed) {
        const embeddingResult = await provider.embed({ text: doc.title });
        embeddingJson = JSON.stringify(embeddingResult.vector);
      }
    } catch (err) {
      console.error('Failed to generate embedding:', err);
    }

    await db.insert(knowledgeChunks).values({
      documentId: id,
      projectId: doc.projectId,
      chunkIndex: 0,
      content: doc.title,
      metadata: { sourceUrl: doc.sourceUrl },
      embedding: embeddingJson,
    });
  } else {
    // For text-based documents
    let embeddingJson: string | null = null;
    try {
      if (provider.embed) {
        const embeddingResult = await provider.embed({ text: doc.title });
        embeddingJson = JSON.stringify(embeddingResult.vector);
      }
    } catch (err) {
      console.error('Failed to generate embedding:', err);
    }

    await db.insert(knowledgeChunks).values({
      documentId: id,
      projectId: doc.projectId,
      chunkIndex: 0,
      content: doc.title,
      metadata: {},
      embedding: embeddingJson,
    });
  }

  await db
    .update(knowledgeDocuments)
    .set({ status: 'ready', updatedAt: new Date() })
    .where(eq(knowledgeDocuments.id, id));

  return c.json({
    data: { status: 'ready', message: 'Document processed successfully' },
  });
});
