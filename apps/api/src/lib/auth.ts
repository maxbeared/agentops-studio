import { verifyToken } from './jwt';
import { db } from '@agentops/db';
import { users, organizations, organizationMembers } from '@agentops/db/schema';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';

export interface AuthUser {
  userId: string;
  email: string;
  orgId: string | null;
}

export interface AuthPayload {
  userId: string;
  email: string;
  orgId: string | null;
}

export async function getAuthUser(c: Context): Promise<AuthUser | null> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token) as AuthPayload;

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      return null;
    }

    let orgId = payload.orgId;
    if (!orgId) {
      const orgMembers = await db.query.organizationMembers.findMany({
        where: eq(organizationMembers.userId, user.id),
      });
      orgId = orgMembers[0]?.organizationId || null;
    }

    return {
      userId: user.id,
      email: user.email,
      orgId,
    };
  } catch {
    return null;
  }
}

export function requireAuth(getUser: () => Promise<AuthUser | null>) {
  return async (c: Context) => {
    const user = await getUser();
    if (!user) {
      return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
    }
    return user;
  };
}