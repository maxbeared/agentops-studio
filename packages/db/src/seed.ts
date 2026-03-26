import { db } from './index';
import { users, organizations, organizationMembers } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const DEMO_USER = {
  email: 'demo@agentops.studio',
  password: 'demo123456',
  name: 'Demo User',
};

const DEMO_ORG = {
  name: 'AgentOps Studio',
  slug: 'agentops-studio',
};

async function seed() {
  console.log('🌱 Starting seed...');

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, DEMO_USER.email),
  });

  if (existingUser) {
    console.log('✅ Demo user already exists, skipping seed');
    console.log(`   User ID: ${existingUser.id}`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);

  const [user] = await db
    .insert(users)
    .values({
      email: DEMO_USER.email,
      passwordHash,
      name: DEMO_USER.name,
    })
    .returning();

  console.log(`✅ Created demo user: ${user.email}`);
  console.log(`   User ID: ${user.id}`);

  const [org] = await db
    .insert(organizations)
    .values({
      name: DEMO_ORG.name,
      slug: DEMO_ORG.slug,
      ownerId: user.id,
    })
    .returning();

  console.log(`✅ Created demo organization: ${org.name}`);
  console.log(`   Org ID: ${org.id}`);

  await db.insert(organizationMembers).values({
    organizationId: org.id,
    userId: user.id,
    role: 'owner',
  });

  console.log('✅ Added user as organization owner');
  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Demo credentials:');
  console.log(`   Email: ${DEMO_USER.email}`);
  console.log(`   Password: ${DEMO_USER.password}`);
}

seed().catch(console.error);