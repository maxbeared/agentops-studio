import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

const {
  mockHashPassword,
  mockComparePassword,
  mockSignToken,
  mockVerifyToken,
  mockUploadAvatar,
} = vi.hoisted(() => ({
  mockHashPassword: vi.fn(async () => 'hashed_password_123'),
  mockComparePassword: vi.fn(async () => true),
  mockSignToken: vi.fn(() => 'mock_jwt_token'),
  mockVerifyToken: vi.fn(() => ({ userId: 'user-123', email: 'test@test.com', orgId: 'org-123' as string | null })),
  mockUploadAvatar: vi.fn(async () => 'https://mock-minio.example.com/avatar.png'),
}));

// Use vi.hoisted to ensure mocks are properly set up and accessible
vi.mock('@agentops/db', () => {
  const mockQuery = {
    users: { findFirst: vi.fn(), findMany: vi.fn() },
    organizations: { findFirst: vi.fn(), findMany: vi.fn() },
    organizationMembers: { findFirst: vi.fn(), findMany: vi.fn() },
  };
  return {
    db: {
      query: mockQuery,
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockImplementation(() => {
        const chain = {
          set: vi.fn(),
          where: vi.fn(),
          returning: vi.fn(),
        } as any;

        chain.set.mockReturnValue(chain);
        chain.where.mockReturnValue(chain);
        chain.returning.mockResolvedValue([
          {
            id: 'user-123',
            email: 'test@test.com',
            name: 'Updated Name',
            avatarUrl: 'https://mock-minio.example.com/avatar.png',
          },
        ]);

        return chain;
      }),
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
    },
    _mockQuery: mockQuery,
  };
});

// Mock password lib used by auth route
vi.mock('../lib/password', () => ({
  hashPassword: mockHashPassword,
  comparePassword: mockComparePassword,
}));

// Mock jwt lib used by auth route
vi.mock('../lib/jwt', () => ({
  signToken: mockSignToken,
  verifyToken: mockVerifyToken,
}));

// Mock minio lib used by auth route
vi.mock('../lib/minio', () => ({
  uploadAvatar: mockUploadAvatar,
  getFileUrl: vi.fn(async () => 'https://mock-minio.example.com/file-key-123'),
}));

import { authRoutes } from '../routes/auth';

function createTestApp() {
  const app = new Hono();
  app.route('/auth', authRoutes);
  return app;
}

describe('auth routes', () => {
  let app: Hono;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked db module
    const dbModule = await import('@agentops/db');
    const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;

    // Fully reset DB query mocks (including one-time return queues)
    mockQuery.users.findFirst.mockReset();
    mockQuery.users.findMany.mockReset();
    mockQuery.organizations.findFirst.mockReset();
    mockQuery.organizations.findMany.mockReset();
    mockQuery.organizationMembers.findFirst.mockReset();
    mockQuery.organizationMembers.findMany.mockReset();

    // Reset mock return values
    mockQuery.users.findFirst.mockResolvedValue(null);
    mockQuery.users.findMany.mockResolvedValue([]);
    mockQuery.organizations.findFirst.mockResolvedValue(null);
    mockQuery.organizations.findMany.mockResolvedValue([]);
    mockQuery.organizationMembers.findFirst.mockResolvedValue(null);
    mockQuery.organizationMembers.findMany.mockResolvedValue([]);

    // Reset auth/minio mocks to default behavior
    mockHashPassword.mockReset();
    mockHashPassword.mockResolvedValue('hashed_password_123');
    mockComparePassword.mockReset();
    mockComparePassword.mockResolvedValue(true);
    mockSignToken.mockReset();
    mockSignToken.mockReturnValue('mock_jwt_token');
    mockVerifyToken.mockReset();
    mockVerifyToken.mockReturnValue({ userId: 'user-123', email: 'test@test.com', orgId: 'org-123' });
    mockUploadAvatar.mockReset();
    mockUploadAvatar.mockResolvedValue('https://mock-minio.example.com/avatar.png');

    app = createTestApp();
  });

  describe('POST /auth/register', () => {
    it('should reject duplicate email', async () => {
      const dbModule = await import('@agentops/db');
      const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;
      mockQuery.users.findFirst.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'test@test.com',
        name: 'Existing User',
      });

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'password123',
          name: 'Test User',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Email already registered');
    });

    it('should reject invalid email format', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'password123',
          name: 'Test User',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject password less than 6 characters', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: '12345',
          name: 'Test User',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject empty name', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'password123',
          name: '',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject missing email', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'password123',
          name: 'Test User',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject missing password', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          name: 'Test User',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const dbModule = await import('@agentops/db');
      const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;
      mockQuery.users.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });
      mockQuery.organizationMembers.findMany.mockResolvedValueOnce([
        { id: 'member-123', organizationId: 'org-123', userId: 'user-123', role: 'owner' },
      ]);
      mockQuery.organizations.findFirst.mockResolvedValueOnce({
        id: 'org-123',
        name: 'Test Organization',
        slug: 'test-org',
      });

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.token).toBeDefined();
      expect(data.data.user.email).toBe('test@test.com');
    });

    it('should reject non-existent user', async () => {
      const dbModule = await import('@agentops/db');
      const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;
      mockQuery.users.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Invalid email or password');
    });

    it('should reject wrong password', async () => {
      const dbModule = await import('@agentops/db');
      const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;
      mockQuery.users.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });

      mockComparePassword.mockResolvedValueOnce(false);

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'wrongpassword',
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Invalid email or password');
    });

    it('should reject invalid email format', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject missing email', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'password123',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject missing password', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user data with valid token', async () => {
      const dbModule = await import('@agentops/db');
      const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;
      mockQuery.users.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        avatarUrl: null,
      });
      mockQuery.organizationMembers.findMany.mockResolvedValueOnce([
        { id: 'member-123', organizationId: 'org-123', userId: 'user-123', role: 'owner' },
      ]);
      mockQuery.organizations.findFirst.mockResolvedValueOnce({
        id: 'org-123',
        name: 'Test Organization',
        slug: 'test-org',
      });

      const res = await app.request('/auth/me', {
        headers: { Authorization: 'Bearer valid_token' },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.user.email).toBe('test@test.com');
      expect(data.data.organization.id).toBe('org-123');
    });

    it('should reject request without Authorization header', async () => {
      const res = await app.request('/auth/me');

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Unauthorized');
    });

    it('should reject request with invalid token format', async () => {
      const res = await app.request('/auth/me', {
        headers: { Authorization: 'InvalidBearerToken' },
      });

      expect(res.status).toBe(401);
    });

    it('should reject request for non-existent user', async () => {
      const dbModule = await import('@agentops/db');
      const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;
      mockQuery.users.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/auth/me', {
        headers: { Authorization: 'Bearer valid_token' },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error.formErrors).toContain('User not found');
    });

    it('should return user without organization if orgId is null', async () => {
      mockVerifyToken.mockReturnValueOnce({ userId: 'user-123', email: 'test@test.com', orgId: null });

      const dbModule = await import('@agentops/db');
      const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;
      mockQuery.users.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        avatarUrl: null,
      });
      mockQuery.organizationMembers.findMany.mockResolvedValueOnce([]);

      const res = await app.request('/auth/me', {
        headers: { Authorization: 'Bearer valid_token' },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.user.email).toBe('test@test.com');
      expect(data.data.organization).toBeNull();
    });
  });

  describe('PUT /auth/profile', () => {
    it('should reject update without auth token', async () => {
      const res = await app.request('/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      expect(res.status).toBe(401);
    });

    it('should reject update with invalid token format', async () => {
      const res = await app.request('/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'InvalidToken',
        },
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      expect(res.status).toBe(401);
    });

    it('should reject invalid profile payload', async () => {
      const res = await app.request('/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({ name: '' }),
      });

      expect(res.status).toBe(400);
    });

    it('should update profile successfully', async () => {
      const res = await app.request('/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({
          name: 'Updated Name',
          avatarUrl: 'https://example.com/avatar.png',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.user.id).toBe('user-123');
      expect(data.data.user.name).toBe('Updated Name');
    });

    it('should return 401 when token verification throws', async () => {
      mockVerifyToken.mockImplementationOnce(() => {
        throw new Error('bad token');
      });

      const res = await app.request('/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid_token',
        },
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /auth/password', () => {
    it('should reject password change without auth token', async () => {
      const res = await app.request('/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('should reject password change with invalid token format', async () => {
      const res = await app.request('/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'InvalidToken',
        },
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('should reject invalid password payload', async () => {
      const res = await app.request('/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: '123',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should return 404 when user does not exist', async () => {
      const dbModule = await import('@agentops/db');
      const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;
      mockQuery.users.findFirst.mockResolvedValueOnce(null);

      const res = await app.request('/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error.formErrors).toContain('User not found');
    });

    it('should reject incorrect current password', async () => {
      const dbModule = await import('@agentops/db');
      const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;
      mockQuery.users.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });

      mockComparePassword.mockResolvedValueOnce(false);

      const res = await app.request('/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({
          currentPassword: 'wrong-password',
          newPassword: 'newpassword123',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Current password is incorrect');
    });

    it('should change password successfully', async () => {
      const dbModule = await import('@agentops/db');
      const mockQuery = (dbModule as unknown as { _mockQuery: any })._mockQuery;
      mockQuery.users.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      });

      const res = await app.request('/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.success).toBe(true);
    });

    it('should return 401 when token verification throws', async () => {
      mockVerifyToken.mockImplementationOnce(() => {
        throw new Error('bad token');
      });

      const res = await app.request('/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid_token',
        },
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/avatar', () => {
    it('should reject avatar without auth token', async () => {
      const res = await app.request('/auth/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('should reject avatar with invalid token format', async () => {
      const res = await app.request('/auth/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'InvalidToken',
        },
        body: JSON.stringify({
          avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('should reject missing avatar data', async () => {
      const res = await app.request('/auth/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Avatar data is required');
    });

    it('should reject invalid avatar format', async () => {
      const res = await app.request('/auth/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({ avatar: 'not-image-base64' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Invalid image format');
    });

    it('should reject oversized avatar payload', async () => {
      const res = await app.request('/auth/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({
          avatar: `data:image/png;base64,${'a'.repeat(1024 * 1024)}`,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.formErrors).toContain('Image too large, max 1MB');
    });

    it('should upload avatar successfully', async () => {
      const res = await app.request('/auth/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({
          avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.user.id).toBe('user-123');
      expect(data.data.user.avatarUrl).toBe('https://mock-minio.example.com/avatar.png');
    });

    it('should return upload error message when upload fails', async () => {
      mockUploadAvatar.mockImplementationOnce(async () => {
        throw new Error('upload failed');
      });

      const res = await app.request('/auth/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token',
        },
        body: JSON.stringify({
          avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.formErrors).toContain('upload failed');
    });
  });
});