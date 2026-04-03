import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Use vi.hoisted to define mocks before vi.mock runs
const { mockWorkflowsQuery, mockWorkflowVersionsQuery, mockWorkflowNodesQuery, mockWorkflowEdgesQuery, mockWorkflowRunsQuery, mockWorkflowNodeRunsQuery, mockQueueAdd } = vi.hoisted(() => ({
  mockWorkflowsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockWorkflowVersionsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockWorkflowNodesQuery: {
    findMany: vi.fn(),
  },
  mockWorkflowEdgesQuery: {
    findMany: vi.fn(),
  },
  mockWorkflowRunsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockWorkflowNodeRunsQuery: {
    findMany: vi.fn(),
  },
  mockQueueAdd: vi.fn().mockResolvedValue({ id: 'job-123' }),
}));

// Mock BullMQ - use a class-like structure
vi.mock('bullmq', () => {
  class MockQueue {
    add = mockQueueAdd;
  }
  return {
    Queue: MockQueue,
  };
});

// Mock getAuthUser
vi.mock('../lib/auth', () => ({
  getAuthUser: vi.fn().mockResolvedValue({ userId: 'user-123', email: 'test@test.com', orgId: 'org-123' }),
}));

// Mock the database
vi.mock('@agentops/db', () => ({
  db: {
    query: {
      workflows: mockWorkflowsQuery,
      workflowVersions: mockWorkflowVersionsQuery,
      workflowNodes: mockWorkflowNodesQuery,
      workflowEdges: mockWorkflowEdgesQuery,
      workflowRuns: mockWorkflowRunsQuery,
      workflowNodeRuns: mockWorkflowNodeRunsQuery,
    },
    insert: vi.fn().mockReturnThis(),
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

// Import routes after mocks are set up
import { workflowRoutes } from '../routes/workflows';
import { runRoutes } from '../routes/runs';

function createWorkflowApp() {
  const app = new Hono();
  app.route('/workflows', workflowRoutes);
  return app;
}

function createRunsApp() {
  const app = new Hono();
  app.route('/runs', runRoutes);
  return app;
}

describe('workflow routes', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock returns
    mockWorkflowsQuery.findFirst.mockResolvedValue(null);
    mockWorkflowsQuery.findMany.mockResolvedValue([]);
    mockWorkflowVersionsQuery.findFirst.mockResolvedValue(null);
    mockWorkflowVersionsQuery.findMany.mockResolvedValue([]);
    mockWorkflowNodesQuery.findMany.mockResolvedValue([]);
    mockWorkflowEdgesQuery.findMany.mockResolvedValue([]);

    app = createWorkflowApp();
  });

  describe('GET /workflows', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/workflows');

      expect(res.status).toBe(401);
    });

    it('should return empty list when no workflows exist', async () => {
      mockWorkflowsQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/workflows');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toEqual([]);
    });

    it('should return workflows list', async () => {
      mockWorkflowsQuery.findMany.mockResolvedValueOnce([
        {
          id: 'wf-1',
          projectId: 'proj-1',
          name: 'Test Workflow',
          description: 'Test Description',
          status: 'draft',
          latestVersionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await app.request('/workflows');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Test Workflow');
    });

    it('should filter workflows by projectId', async () => {
      mockWorkflowsQuery.findMany.mockResolvedValueOnce([
        {
          id: 'wf-1',
          projectId: 'proj-1',
          name: 'Workflow 1',
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await app.request('/workflows?projectId=proj-1');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toHaveLength(1);
    });
  });

  describe('POST /workflows', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'proj-1',
          name: 'New Workflow',
          description: 'Description',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('should reject workflow without name', async () => {
      const res = await app.request('/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'proj-1',
          description: 'Description',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject workflow without projectId', async () => {
      const res = await app.request('/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Workflow',
          description: 'Description',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /workflows/:id', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/workflows/wf-123');

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent workflow', async () => {
      mockWorkflowsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/workflows/wf-123');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Workflow not found');
    });

    it('should return workflow with definition', async () => {
      mockWorkflowsQuery.findFirst.mockResolvedValueOnce({
        id: 'wf-123',
        projectId: 'proj-1',
        name: 'Test Workflow',
        description: 'Test Description',
        status: 'published',
        latestVersionId: 'wv-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockWorkflowVersionsQuery.findFirst.mockResolvedValueOnce({
        id: 'wv-1',
        workflowId: 'wf-123',
        version: 1,
        definition: { nodes: [], edges: [] },
        publishedAt: new Date(),
        createdBy: 'user-123',
      });

      mockWorkflowNodesQuery.findMany.mockResolvedValueOnce([]);
      mockWorkflowEdgesQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/workflows/wf-123');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.id).toBe('wf-123');
      expect(data.data.latestVersion).toBe(1);
    });
  });

  describe('POST /workflows/:id/publish', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/workflows/wf-123/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          definition: { nodes: [], edges: [] },
        }),
      });

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent workflow', async () => {
      mockWorkflowsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/workflows/550e8400-e29b-41d4-a716-446655440000/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: '550e8400-e29b-41d4-a716-446655440000',
          definition: { nodes: [], edges: [] },
        }),
      });

      expect(res.status).toBe(404);
    });

    it('should reject invalid definition format', async () => {
      mockWorkflowsQuery.findFirst.mockResolvedValueOnce({
        id: 'wf-123',
        name: 'Test',
        status: 'draft',
      });

      const res = await app.request('/workflows/wf-123/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: '550e8400-e29b-41d4-a716-446655440000',
          definition: 'invalid',
        }),
      });

      expect(res.status).toBe(400);
    });
  });
});

describe('run routes', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock returns
    mockWorkflowRunsQuery.findFirst.mockResolvedValue(null);
    mockWorkflowRunsQuery.findMany.mockResolvedValue([]);
    mockWorkflowVersionsQuery.findFirst.mockResolvedValue(null);
    mockWorkflowNodesQuery.findMany.mockResolvedValue([]);
    mockWorkflowNodeRunsQuery.findMany.mockResolvedValue([]);

    app = createRunsApp();
  });

  describe('GET /runs', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/runs');

      expect(res.status).toBe(401);
    });

    it('should return empty list when no runs exist', async () => {
      mockWorkflowRunsQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/runs');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toEqual([]);
    });

    it('should return runs list', async () => {
      mockWorkflowRunsQuery.findMany.mockResolvedValueOnce([
        {
          id: 'run-1',
          workflowVersionId: 'wv-1',
          projectId: 'proj-1',
          triggerType: 'api',
          status: 'success',
          totalTokens: 1000,
          totalCost: 0.05,
          startedAt: new Date(),
          finishedAt: new Date(),
          createdAt: new Date(),
        },
      ]);

      const res = await app.request('/runs');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('success');
    });

    it('should filter runs by projectId', async () => {
      mockWorkflowRunsQuery.findMany.mockResolvedValueOnce([
        {
          id: 'run-1',
          workflowVersionId: 'wv-1',
          projectId: 'proj-1',
          triggerType: 'api',
          status: 'pending',
          createdAt: new Date(),
        },
      ]);

      const res = await app.request('/runs?projectId=proj-1');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toHaveLength(1);
    });
  });

  describe('POST /runs', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowVersionId: 'wv-1',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent workflow version', async () => {
      mockWorkflowVersionsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowVersionId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Workflow version not found');
    });

    it('should reject run without workflowVersionId', async () => {
      const res = await app.request('/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /runs/:id', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/runs/run-123');

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent run', async () => {
      mockWorkflowRunsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/runs/run-123');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Run not found');
    });

    it('should return run details', async () => {
      mockWorkflowRunsQuery.findFirst.mockResolvedValueOnce({
        id: 'run-123',
        workflowVersionId: 'wv-1',
        projectId: 'proj-1',
        triggerType: 'api',
        status: 'running',
        inputPayload: { key: 'value' },
        outputPayload: null,
        totalTokens: 500,
        totalCost: 0.025,
        errorMessage: null,
        startedAt: new Date(),
        finishedAt: null,
        createdAt: new Date(),
      });

      const res = await app.request('/runs/run-123');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.id).toBe('run-123');
      expect(data.data.status).toBe('running');
    });
  });

  describe('GET /runs/:id/nodes', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/runs/run-123/nodes');

      expect(res.status).toBe(401);
    });

    it('should return node runs for a run', async () => {
      mockWorkflowNodeRunsQuery.findMany.mockResolvedValueOnce([
        {
          nodeKey: 'llm-node',
          nodeType: 'llm',
          status: 'success',
          inputPayload: { prompt: 'test' },
          outputPayload: { response: 'result' },
          errorMessage: null,
          startedAt: new Date(),
          finishedAt: new Date(),
          durationMs: 1500,
          tokenUsageInput: 100,
          tokenUsageOutput: 200,
          cost: 0.01,
        },
      ]);

      const res = await app.request('/runs/run-123/nodes');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.runId).toBe('run-123');
      expect(data.data.nodes).toHaveLength(1);
      expect(data.data.nodes[0].nodeKey).toBe('llm-node');
    });

    it('should return empty nodes array when no node runs exist', async () => {
      mockWorkflowNodeRunsQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/runs/run-123/nodes');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.nodes).toEqual([]);
    });
  });
});