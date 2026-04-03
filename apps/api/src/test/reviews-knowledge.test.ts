import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Use vi.hoisted to define mocks before vi.mock runs
const {
  mockReviewTasksQuery,
  mockWorkflowRunsQuery,
  mockWorkflowNodeRunsQuery,
  mockWorkflowVersionsQuery,
  mockUsersQuery,
  mockKnowledgeDocumentsQuery,
  mockKnowledgeChunksQuery,
  mockQueueAdd,
} = vi.hoisted(() => ({
  mockReviewTasksQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockWorkflowRunsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockWorkflowNodeRunsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockWorkflowVersionsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockUsersQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockKnowledgeDocumentsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockKnowledgeChunksQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockQueueAdd: vi.fn().mockResolvedValue({ id: 'job-123' }),
}));

// Mock getAuthUser
vi.mock('../lib/auth', () => ({
  getAuthUser: vi.fn().mockResolvedValue({ userId: 'user-123', email: 'test@test.com', orgId: 'org-123' }),
}));

// Mock BullMQ
vi.mock('bullmq', () => {
  class MockQueue {
    add = mockQueueAdd;
  }
  return { Queue: MockQueue };
});

// Mock minio
vi.mock('../lib/minio', () => ({
  uploadFile: vi.fn().mockResolvedValue('file-key-123'),
  getFileUrl: vi.fn().mockResolvedValue('https://minio.example.com/file-key-123'),
}));

// Mock @agentops/ai
vi.mock('@agentops/ai', () => ({
  createLLMProvider: vi.fn().mockReturnValue({
    generate: vi.fn().mockResolvedValue({ content: 'mock', usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 } }),
    embed: vi.fn().mockResolvedValue({ vector: [0.1, 0.2, 0.3] }),
  }),
}));

// Mock the database
vi.mock('@agentops/db', () => ({
  db: {
    query: {
      reviewTasks: mockReviewTasksQuery,
      workflowRuns: mockWorkflowRunsQuery,
      workflowNodeRuns: mockWorkflowNodeRunsQuery,
      workflowVersions: mockWorkflowVersionsQuery,
      users: mockUsersQuery,
      knowledgeDocuments: mockKnowledgeDocumentsQuery,
      knowledgeChunks: mockKnowledgeChunksQuery,
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
}));

import { reviewRoutes } from '../routes/reviews';
import { knowledgeRoutes } from '../routes/knowledge';

function createReviewsApp() {
  const app = new Hono();
  app.route('/reviews', reviewRoutes);
  return app;
}

function createKnowledgeApp() {
  const app = new Hono();
  app.route('/knowledge', knowledgeRoutes);
  return app;
}

describe('review routes', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReviewTasksQuery.findFirst.mockResolvedValue(null);
    mockReviewTasksQuery.findMany.mockResolvedValue([]);
    mockWorkflowRunsQuery.findFirst.mockResolvedValue(null);
    mockWorkflowNodeRunsQuery.findFirst.mockResolvedValue(null);
    mockWorkflowVersionsQuery.findFirst.mockResolvedValue(null);
    mockUsersQuery.findFirst.mockResolvedValue(null);

    app = createReviewsApp();
  });

  describe('GET /reviews', () => {
    it('should return empty list when no review tasks', async () => {
      mockReviewTasksQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/reviews');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toEqual([]);
    });

    it('should filter reviews by status', async () => {
      mockReviewTasksQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/reviews?status=pending');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toEqual([]);
    });

    it('should return reviews with details', async () => {
      mockReviewTasksQuery.findMany.mockResolvedValueOnce([
        {
          id: 'task-1',
          status: 'pending',
          reviewComment: null,
          reviewedOutput: null,
          createdAt: new Date(),
          reviewedAt: null,
          workflowRunId: 'run-1',
          workflowNodeRunId: 'node-run-1',
          assigneeUserId: null,
        },
      ]);

      mockWorkflowRunsQuery.findFirst.mockResolvedValueOnce({
        id: 'run-1',
        status: 'waiting_review',
        outputPayload: { result: 'pending' },
      });

      mockWorkflowNodeRunsQuery.findFirst.mockResolvedValueOnce({
        id: 'node-run-1',
        nodeKey: 'llm-node',
        nodeType: 'llm',
        outputPayload: { text: 'output' },
      });

      const res = await app.request('/reviews');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe('task-1');
      expect(data.data[0].workflowRun).toBeDefined();
      expect(data.data[0].nodeRun).toBeDefined();
    });
  });

  describe('GET /reviews/:id', () => {
    it('should return 404 for non-existent review task', async () => {
      mockReviewTasksQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/reviews/task-1');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Review task not found');
    });

    it('should return review task with run details', async () => {
      mockReviewTasksQuery.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        status: 'pending',
        reviewComment: null,
        reviewedOutput: null,
        createdAt: new Date(),
        reviewedAt: null,
        workflowRunId: 'run-1',
        workflowNodeRunId: 'node-run-1',
      });

      mockWorkflowRunsQuery.findFirst.mockResolvedValueOnce({
        id: 'run-1',
        status: 'waiting_review',
        outputPayload: null,
      });

      mockWorkflowNodeRunsQuery.findFirst.mockResolvedValueOnce({
        id: 'node-run-1',
        nodeKey: 'llm-node',
        nodeType: 'llm',
        outputPayload: null,
      });

      const res = await app.request('/reviews/task-1');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.id).toBe('task-1');
      expect(data.data.workflowRun).toBeDefined();
      expect(data.data.nodeRun).toBeDefined();
    });
  });

  describe('POST /reviews/:id/approve', () => {
    it('should return 404 for non-existent task', async () => {
      mockReviewTasksQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/reviews/task-1/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(404);
    });

    it('should reject already reviewed task', async () => {
      mockReviewTasksQuery.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        status: 'approved',
        workflowRunId: 'run-1',
        workflowNodeRunId: 'node-run-1',
      });

      const res = await app.request('/reviews/task-1/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Task has already been reviewed');
    });

    it('should return 404 when workflow run not found', async () => {
      mockReviewTasksQuery.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        status: 'pending',
        workflowRunId: 'run-1',
        workflowNodeRunId: 'node-run-1',
      });

      mockWorkflowRunsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/reviews/task-1/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(404);
    });

    it('should return 404 when workflow version not found', async () => {
      mockReviewTasksQuery.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        status: 'pending',
        workflowRunId: 'run-1',
        workflowNodeRunId: 'node-run-1',
      });

      mockWorkflowRunsQuery.findFirst.mockResolvedValueOnce({
        id: 'run-1',
        workflowVersionId: 'wv-1',
        inputPayload: {},
      });

      mockWorkflowVersionsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/reviews/task-1/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(404);
    });

    it('should approve pending task successfully', async () => {
      mockReviewTasksQuery.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        status: 'pending',
        workflowRunId: 'run-1',
        workflowNodeRunId: 'node-run-1',
        reviewedOutput: { result: 'approved output' },
      });

      mockWorkflowRunsQuery.findFirst.mockResolvedValueOnce({
        id: 'run-1',
        workflowVersionId: 'wv-1',
        inputPayload: {},
      });

      mockWorkflowVersionsQuery.findFirst.mockResolvedValueOnce({
        id: 'wv-1',
        workflowId: 'wf-1',
        definition: { nodes: [], edges: [] },
      });

      mockWorkflowNodeRunsQuery.findMany.mockResolvedValueOnce([]);
      mockWorkflowNodeRunsQuery.findFirst.mockResolvedValueOnce({
        id: 'node-run-1',
        nodeKey: 'llm-node',
        workflowRunId: 'run-1',
      });

      const res = await app.request('/reviews/task-1/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: 'Looks good', output: { result: 'custom output' } }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.status).toBe('approved');
      expect(data.data.message).toContain('approved');
    });
  });

  describe('POST /reviews/:id/reject', () => {
    it('should return 404 for non-existent task', async () => {
      mockReviewTasksQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/reviews/task-1/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(404);
    });

    it('should reject already reviewed task', async () => {
      mockReviewTasksQuery.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        status: 'rejected',
        workflowRunId: 'run-1',
        workflowNodeRunId: 'node-run-1',
      });

      const res = await app.request('/reviews/task-1/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it('should reject pending task successfully', async () => {
      mockReviewTasksQuery.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        status: 'pending',
        workflowRunId: 'run-1',
        workflowNodeRunId: 'node-run-1',
      });

      const res = await app.request('/reviews/task-1/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: 'Not acceptable' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.status).toBe('rejected');
    });
  });
});

describe('knowledge routes', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();

    mockKnowledgeDocumentsQuery.findFirst.mockResolvedValue(null);
    mockKnowledgeDocumentsQuery.findMany.mockResolvedValue([]);
    mockKnowledgeChunksQuery.findFirst.mockResolvedValue(null);
    mockKnowledgeChunksQuery.findMany.mockResolvedValue([]);

    app = createKnowledgeApp();
  });

  describe('GET /knowledge', () => {
    it('should return empty list when no documents', async () => {
      mockKnowledgeDocumentsQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/knowledge');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toEqual([]);
    });

    it('should return documents list', async () => {
      mockKnowledgeDocumentsQuery.findMany.mockResolvedValueOnce([
        {
          id: 'doc-1',
          projectId: 'proj-1',
          title: 'Test Document',
          sourceType: 'file',
          sourceUrl: null,
          fileKey: 'file-key',
          mimeType: 'text/plain',
          status: 'ready',
          version: 1,
          createdAt: new Date(),
        },
      ]);

      const res = await app.request('/knowledge');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Test Document');
    });

    it('should filter documents by projectId', async () => {
      mockKnowledgeDocumentsQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/knowledge?projectId=proj-1');

      expect(res.status).toBe(200);
    });
  });

  describe('POST /knowledge/upload', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/knowledge/upload', {
        method: 'POST',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /knowledge', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(401);
    });

    it('should reject document without required fields', async () => {
      const res = await app.request('/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject document with invalid sourceType', async () => {
      const res = await app.request('/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Test',
          sourceType: 'invalid',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject document with empty title', async () => {
      const res = await app.request('/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: '550e8400-e29b-41d4-a716-446655440000',
          title: '',
          sourceType: 'text',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /knowledge/:id', () => {
    it('should return 404 for non-existent document', async () => {
      mockKnowledgeDocumentsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/knowledge/doc-1');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Document not found');
    });

    it('should return document with chunks count', async () => {
      mockKnowledgeDocumentsQuery.findFirst.mockResolvedValueOnce({
        id: 'doc-1',
        projectId: 'proj-1',
        title: 'Test Document',
        sourceType: 'url',
        sourceUrl: 'https://example.com',
        fileKey: null,
        mimeType: null,
        status: 'ready',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockKnowledgeChunksQuery.findMany.mockResolvedValueOnce([
        { id: 'chunk-1', documentId: 'doc-1', content: 'chunk text' },
        { id: 'chunk-2', documentId: 'doc-1', content: 'chunk text 2' },
      ]);

      const res = await app.request('/knowledge/doc-1');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.id).toBe('doc-1');
      expect(data.data.chunksCount).toBe(2);
    });
  });

  describe('POST /knowledge/:id/process', () => {
    it('should return 404 for non-existent document', async () => {
      mockKnowledgeDocumentsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/knowledge/doc-1/process', {
        method: 'POST',
      });

      expect(res.status).toBe(404);
    });

    it('should process a URL-based document', async () => {
      mockKnowledgeDocumentsQuery.findFirst.mockResolvedValueOnce({
        id: 'doc-1',
        projectId: 'proj-1',
        title: 'URL Document',
        sourceType: 'url',
        sourceUrl: 'https://example.com/doc',
        fileKey: null,
        mimeType: null,
        status: 'uploaded',
        version: 1,
      });

      const res = await app.request('/knowledge/doc-1/process', {
        method: 'POST',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.status).toBe('ready');
    });

    it('should process a file-based document', async () => {
      mockKnowledgeDocumentsQuery.findFirst.mockResolvedValueOnce({
        id: 'doc-1',
        projectId: 'proj-1',
        title: 'File Document with multiple words',
        sourceType: 'file',
        sourceUrl: null,
        fileKey: 'file-key-123',
        mimeType: 'text/plain',
        status: 'uploaded',
        version: 1,
      });

      const res = await app.request('/knowledge/doc-1/process', {
        method: 'POST',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.status).toBe('ready');
    });
  });
});