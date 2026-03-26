import { Hono } from 'hono';
import { db } from '@agentops/db';
import { users, organizations, organizationMembers } from '@agentops/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../lib/password';
import { signToken, verifyToken } from '../lib/jwt';
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
