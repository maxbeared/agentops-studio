import { vi } from 'vitest';

// Mock @agentops/db
vi.mock('@agentops/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      organizations: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      organizationMembers: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      projects: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      workflows: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      workflowVersions: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      workflowRuns: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      workflowNodes: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      workflowEdges: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      knowledgeDocuments: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      knowledgeChunks: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      promptTemplates: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      reviewTasks: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      modelProviders: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      aiModelConfigs: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    all: vi.fn().mockResolvedValue([]),
  },
  users: {},
  organizations: {},
  organizationMembers: {},
  projects: {},
  workflows: {},
  workflowVersions: {},
  workflowNodes: {},
  workflowEdges: {},
  workflowRuns: {},
  workflowNodeRuns: {},
  reviewTasks: {},
  deliveryJobs: {},
  modelProviders: {},
  aiModelConfigs: {},
  workflowModifications: {},
  auditLogs: {},
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock_jwt_token'),
    verify: vi.fn().mockReturnValue({ userId: 'user-123', email: 'test@test.com', orgId: 'org-123' }),
  },
  sign: vi.fn().mockReturnValue('mock_jwt_token'),
  verify: vi.fn().mockReturnValue({ userId: 'user-123', email: 'test@test.com', orgId: 'org-123' }),
}));

// Mock ../lib/password
vi.mock('../lib/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
  comparePassword: vi.fn().mockResolvedValue(true),
}));

// Mock ../lib/jwt
vi.mock('../lib/jwt', () => ({
  signToken: vi.fn().mockReturnValue('mock_jwt_token'),
  verifyToken: vi.fn().mockReturnValue({ userId: 'user-123', email: 'test@test.com', orgId: 'org-123' }),
}));

// Mock ../lib/minio
vi.mock('../lib/minio', () => ({
  uploadAvatar: vi.fn().mockResolvedValue('https://mock-minio.example.com/avatar.png'),
}));

// Mock bullmq
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
    getJob: vi.fn(),
  })),
  Worker: vi.fn(),
}));
