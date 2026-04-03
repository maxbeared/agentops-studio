import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Use vi.hoisted to define mocks before vi.mock runs
const {
  mockProjectsQuery,
  mockOrganizationsQuery,
  mockReviewTasksQuery,
  mockWorkflowRunsQuery,
  mockWorkflowVersionsQuery,
  mockWorkflowsQuery,
  mockSelectFromWhere,
} = vi.hoisted(() => ({
  mockProjectsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockOrganizationsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockReviewTasksQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockWorkflowRunsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockWorkflowVersionsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockWorkflowsQuery: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  mockSelectFromWhere: vi.fn().mockResolvedValue([{ sum: '0.50' }, { count: 0 }]),
}));

// Mock getAuthUser
vi.mock('../lib/auth', () => ({
  getAuthUser: vi.fn().mockResolvedValue({ userId: 'user-123', email: 'test@test.com', orgId: 'org-123' }),
}));

vi.mock('@agentops/db', () => ({
  db: {
    query: {
      projects: mockProjectsQuery,
      organizations: mockOrganizationsQuery,
      reviewTasks: mockReviewTasksQuery,
      workflowRuns: mockWorkflowRunsQuery,
      workflowVersions: mockWorkflowVersionsQuery,
      workflows: mockWorkflowsQuery,
    },
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: mockSelectFromWhere,
      }),
    }),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
}));

import { dashboardRoutes } from '../routes/dashboard';
import { projectRoutes } from '../routes/projects';

function createDashboardApp() {
  const app = new Hono();
  app.route('/dashboard', dashboardRoutes);
  return app;
}

function createProjectsApp() {
  const app = new Hono();
  app.route('/projects', projectRoutes);
  return app;
}

describe('dashboard routes', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWorkflowRunsQuery.findFirst.mockResolvedValue(null);
    mockWorkflowRunsQuery.findMany.mockResolvedValue([]);
    mockWorkflowVersionsQuery.findFirst.mockResolvedValue(null);
    mockWorkflowVersionsQuery.findMany.mockResolvedValue([]);
    mockWorkflowsQuery.findFirst.mockResolvedValue(null);
    mockWorkflowsQuery.findMany.mockResolvedValue([]);
    mockReviewTasksQuery.findFirst.mockResolvedValue(null);
    mockReviewTasksQuery.findMany.mockResolvedValue([]);

    // Mock db.select().from().where() chain for SQL aggregations
    // Already set via vi.mock - the default return is via mockReturnThis chain

    app = createDashboardApp();
  });

  describe('GET /dashboard/stats', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/dashboard/stats');

      expect(res.status).toBe(401);
    });

    it('should return stats with empty runs', async () => {
      mockWorkflowRunsQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/dashboard/stats');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.totalRuns).toBe(0);
      expect(data.data.successRate).toBe(0);
      expect(data.data.totalTokens).toBe(0);
      expect(data.data.pendingReviews).toBe(0);
      expect(data.data.recentRuns).toEqual([]);
    });

    it('should return stats with runs data', async () => {
      mockWorkflowRunsQuery.findMany.mockResolvedValueOnce([
        { id: 'run-1', workflowVersionId: 'wv-1', projectId: 'proj-1', status: 'success', totalTokens: 500, createdAt: new Date() },
        { id: 'run-2', workflowVersionId: 'wv-2', projectId: 'proj-1', status: 'failed', totalTokens: 300, createdAt: new Date() },
      ]);

      mockWorkflowVersionsQuery.findMany.mockResolvedValueOnce([
        { id: 'wv-1', workflowId: 'wf-1' },
        { id: 'wv-2', workflowId: 'wf-2' },
      ]);

      mockWorkflowsQuery.findMany.mockResolvedValueOnce([
        { id: 'wf-1', name: 'Workflow 1' },
        { id: 'wf-2', name: 'Workflow 2' },
      ]);

      const res = await app.request('/dashboard/stats');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.totalRuns).toBe(2);
      expect(data.data.successRate).toBe(50);
      expect(data.data.totalTokens).toBe(800);
    });

    it('should return 100% success rate when all runs succeed', async () => {
      mockWorkflowRunsQuery.findMany.mockResolvedValueOnce([
        { id: 'run-1', workflowVersionId: 'wv-1', status: 'success', totalTokens: 100, createdAt: new Date() },
        { id: 'run-2', workflowVersionId: 'wv-2', status: 'success', totalTokens: 200, createdAt: new Date() },
        { id: 'run-3', workflowVersionId: 'wv-3', status: 'success', totalTokens: 300, createdAt: new Date() },
      ]);

      mockWorkflowVersionsQuery.findMany.mockResolvedValueOnce([]);
      mockWorkflowsQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/dashboard/stats');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.successRate).toBe(100);
    });

    it('should filter stats by projectId', async () => {
      mockWorkflowRunsQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/dashboard/stats?projectId=proj-1');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
    });
  });
});

describe('project routes', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProjectsQuery.findFirst.mockResolvedValue(null);
    mockProjectsQuery.findMany.mockResolvedValue([]);
    mockOrganizationsQuery.findFirst.mockResolvedValue(null);

    app = createProjectsApp();
  });

  describe('GET /projects', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/projects');

      expect(res.status).toBe(401);
    });

    it('should return empty list when no projects', async () => {
      mockProjectsQuery.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/projects');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toEqual([]);
    });

    it('should return projects list', async () => {
      mockProjectsQuery.findMany.mockResolvedValueOnce([
        {
          id: 'proj-1',
          name: 'Project 1',
          description: 'Description',
          organizationId: 'org-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: { id: 'org-123', name: 'Org', slug: 'org' },
        },
      ]);

      const res = await app.request('/projects');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Project 1');
    });

    it('should return empty list when user has no orgId', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ userId: 'user-123', email: 'test@test.com', orgId: null });

      const res = await app.request('/projects');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toEqual([]);
    });
  });

  describe('POST /projects', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Project' }),
      });

      expect(res.status).toBe(401);
    });

    it('should reject project without name', async () => {
      const res = await app.request('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it('should reject project with name too long', async () => {
      const res = await app.request('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'a'.repeat(200) }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject project with invalid organizationId', async () => {
      const res = await app.request('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Project',
          organizationId: 'not-a-uuid',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent organization', async () => {
      mockOrganizationsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Project',
          organizationId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /projects/:id', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/projects/proj-1');

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent project', async () => {
      mockProjectsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/projects/proj-1');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Project not found');
    });

    it('should return project with organization', async () => {
      mockProjectsQuery.findFirst.mockResolvedValueOnce({
        id: 'proj-1',
        name: 'Project 1',
        description: 'Description',
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: { id: 'org-123', name: 'Org', slug: 'org' },
      });

      const res = await app.request('/projects/proj-1');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.id).toBe('proj-1');
      expect(data.data.organization.id).toBe('org-123');
    });
  });

  describe('PUT /projects/:id', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/projects/proj-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent project', async () => {
      mockProjectsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/projects/proj-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });

      expect(res.status).toBe(404);
    });

    it('should reject update with name too long', async () => {
      mockProjectsQuery.findFirst.mockResolvedValueOnce({
        id: 'proj-1',
        name: 'Old Name',
        organizationId: 'org-123',
      });

      const res = await app.request('/projects/proj-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'a'.repeat(200) }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should require authentication', async () => {
      const { getAuthUser } = await import('../lib/auth');
      (getAuthUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await app.request('/projects/proj-1', {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent project', async () => {
      mockProjectsQuery.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/projects/proj-1', {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });
  });
});