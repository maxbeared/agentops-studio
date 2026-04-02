import { Hono } from 'hono';
import { db } from '@agentops/db';
import { users, organizations, organizationMembers } from '@agentops/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../lib/password';
import { signToken, verifyToken } from '../lib/jwt';
import { uploadAvatar } from '../lib/minio';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(120),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

export const authRoutes = new Hono();

authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { email, password, name } = parsed.data;

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return c.json({ error: { formErrors: ['Email already registered'] } }, 400);
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
    })
    .returning();

  const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.random().toString(36).substr(2, 6);
  const [org] = await db
    .insert(organizations)
    .values({
      name: `${name}'s Organization`,
      slug,
      ownerId: user.id,
    })
    .returning();

  await db.insert(organizationMembers).values({
    organizationId: org.id,
    userId: user.id,
    role: 'owner',
  });

  const token = signToken({
    userId: user.id,
    email: user.email,
    orgId: org.id,
  });

  return c.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
    },
  }, 201);
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return c.json({ error: { formErrors: ['Invalid email or password'] } }, 401);
  }

  const valid = await comparePassword(password, user.passwordHash);

  if (!valid) {
    return c.json({ error: { formErrors: ['Invalid email or password'] } }, 401);
  }

  const orgMembers = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, user.id),
  });

  const orgId = orgMembers[0]?.organizationId || null;

  const token = signToken({
    userId: user.id,
    email: user.email,
    orgId,
  });

  return c.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      organization: orgId ? {
        id: orgId,
      } : null,
    },
  });
});

authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token) as { userId: string; email: string; orgId: string };

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      return c.json({ error: { formErrors: ['User not found'] } }, 404);
    }

    const orgMembers = await db.query.organizationMembers.findMany({
      where: eq(organizationMembers.userId, user.id),
    });

    const orgId = payload.orgId || orgMembers[0]?.organizationId || null;

    let org = null;
    if (orgId) {
      org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
      });
    }

    return c.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        organization: org ? {
          id: org.id,
          name: org.name,
          slug: org.slug,
        } : null,
      },
    });
  } catch {
    return c.json({ error: { formErrors: ['Invalid token'] } }, 401);
  }
});

authRoutes.put('/profile', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token) as { userId: string; email: string; orgId: string };
    const body = await c.req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const updates: { name?: string; avatarUrl?: string | null } = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;

    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, payload.userId))
      .returning({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl });

    return c.json({ data: { user } });
  } catch {
    return c.json({ error: { formErrors: ['Invalid token'] } }, 401);
  }
});

authRoutes.put('/password', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token) as { userId: string; email: string; orgId: string };
    const body = await c.req.json();
    const parsed = updatePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      return c.json({ error: { formErrors: ['User not found'] } }, 404);
    }

    const valid = await comparePassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return c.json({ error: { formErrors: ['Current password is incorrect'] } }, 400);
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await db.update(users).set({ passwordHash }).where(eq(users.id, payload.userId));

    return c.json({ data: { success: true } });
  } catch {
    return c.json({ error: { formErrors: ['Invalid token'] } }, 401);
  }
});

authRoutes.post('/avatar', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token) as { userId: string; email: string; orgId: string };
    const body = await c.req.json();

    if (!body.avatar || typeof body.avatar !== 'string') {
      return c.json({ error: { formErrors: ['Avatar data is required'] } }, 400);
    }

    // Validate it's a base64 image
    if (!body.avatar.startsWith('data:image/')) {
      return c.json({ error: { formErrors: ['Invalid image format'] } }, 400);
    }

    // Limit size to 1MB (base64 encoded)
    if (body.avatar.length > 1024 * 1024) {
      return c.json({ error: { formErrors: ['Image too large, max 1MB'] } }, 400);
    }

    // Upload avatar to S3 and get URL
    const avatarUrl = await uploadAvatar(payload.userId, body.avatar);

    const [user] = await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, payload.userId))
      .returning({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl });

    return c.json({ data: { user } });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return c.json({ error: { formErrors: [(err as Error).message || 'Invalid token'] } }, 401);
  }
});
