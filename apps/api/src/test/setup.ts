import { vi } from 'vitest';

// Mock the database
export const mockDb = {
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
  },
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([]),
  all: vi.fn().mockResolvedValue([]),
};

// Mock password functions
export const mockHashPassword = vi.fn().mockResolvedValue('hashed_password_123');
export const mockComparePassword = vi.fn().mockResolvedValue(true);

// Mock JWT functions
export const mockSignToken = vi.fn().mockReturnValue('mock_jwt_token');
export const mockVerifyToken = vi.fn().mockReturnValue({ userId: 'user-123', email: 'test@test.com', orgId: 'org-123' });

// Mock MinIO upload
export const mockUploadAvatar = vi.fn().mockResolvedValue('https://mock-minio.example.com/avatar.png');

// Setup function to configure all mocks
export function setupMocks() {
  // Reset all mocks before each test
  vi.clearAllMocks();

  // Setup default return values for common operations
  mockDb.query.users.findFirst.mockResolvedValue(null);
  mockDb.query.users.findMany.mockResolvedValue([]);
  mockDb.query.organizations.findFirst.mockResolvedValue(null);
  mockDb.query.organizations.findMany.mockResolvedValue([]);
  mockDb.query.organizationMembers.findFirst.mockResolvedValue(null);
  mockDb.query.organizationMembers.findMany.mockResolvedValue([]);

  return {
    mockDb,
    mockHashPassword,
    mockComparePassword,
    mockSignToken,
    mockVerifyToken,
    mockUploadAvatar,
  };
}
