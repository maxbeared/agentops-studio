import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolClient } from 'pg';
import * as schema from './schema';

let pool: Pool | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;
let setupClient: PoolClient | null = null;

export interface TestDatabase {
  db: ReturnType<typeof drizzle>;
  pool: Pool;
  cleanup: () => Promise<void>;
}

async function runMigrations(client: PoolClient): Promise<void> {
  // Create tables if they don't exist (simplified migration)
  // In production, you'd use drizzle-kit or a proper migration tool
  const createTables = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(120) NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      slug VARCHAR(120) NOT NULL UNIQUE,
      owner_id UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organization_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id),
      user_id UUID NOT NULL REFERENCES users(id),
      role VARCHAR(30) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id),
      name VARCHAR(120) NOT NULL,
      description TEXT,
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id),
      title VARCHAR(255) NOT NULL,
      source VARCHAR(20) NOT NULL,
      content TEXT,
      url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      document_id UUID NOT NULL REFERENCES knowledge_documents(id),
      content TEXT NOT NULL,
      embedding TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prompt_templates (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id),
      name VARCHAR(120) NOT NULL,
      template TEXT NOT NULL,
      variables JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id),
      name VARCHAR(120) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'draft' NOT NULL,
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_versions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_id UUID NOT NULL REFERENCES workflows(id),
      version INTEGER NOT NULL,
      source VARCHAR(20) DEFAULT 'manual' NOT NULL,
      definition JSONB NOT NULL,
      interpretation_prompt TEXT,
      interpretation_response TEXT,
      execution_plan JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_nodes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      version_id UUID NOT NULL REFERENCES workflow_versions(id),
      type VARCHAR(30) NOT NULL,
      name VARCHAR(120) NOT NULL,
      config JSONB DEFAULT '{}',
      position JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_edges (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      version_id UUID NOT NULL REFERENCES workflow_versions(id),
      source_node_id UUID NOT NULL,
      target_node_id UUID NOT NULL,
      condition_config JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_runs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_id UUID NOT NULL REFERENCES workflows(id),
      version_id UUID NOT NULL REFERENCES workflow_versions(id),
      status VARCHAR(20) DEFAULT 'pending' NOT NULL,
      input JSONB DEFAULT '{}',
      output JSONB,
      error TEXT,
      interpretation_prompt TEXT,
      execution_plan JSONB,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_node_runs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      run_id UUID NOT NULL REFERENCES workflow_runs(id),
      node_id UUID NOT NULL,
      node_type VARCHAR(30) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' NOT NULL,
      input JSONB DEFAULT '{}',
      output JSONB,
      error TEXT,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      token_usage JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_tasks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      run_id UUID NOT NULL REFERENCES workflow_runs(id),
      node_run_id UUID NOT NULL REFERENCES workflow_node_runs(id),
      status VARCHAR(20) DEFAULT 'pending' NOT NULL,
      input JSONB DEFAULT '{}',
      output JSONB,
      reviewed_by UUID REFERENCES users(id),
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS delivery_jobs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      run_id UUID NOT NULL REFERENCES workflow_runs(id),
      node_run_id UUID NOT NULL REFERENCES workflow_node_runs(id),
      channel VARCHAR(30) NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' NOT NULL,
      result JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS model_providers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id),
      type VARCHAR(20) NOT NULL,
      name VARCHAR(120) NOT NULL,
      api_key TEXT,
      endpoint TEXT,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_model_configs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id),
      provider_type VARCHAR(20) NOT NULL,
      name VARCHAR(120) NOT NULL,
      model VARCHAR(120) NOT NULL,
      api_key TEXT,
      endpoint TEXT,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_modifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_id UUID NOT NULL REFERENCES workflows(id),
      version_id UUID NOT NULL REFERENCES workflow_versions(id),
      modification_prompt TEXT NOT NULL,
      original_definition JSONB NOT NULL,
      modified_definition JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id UUID,
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `;

  await client.query(createTables);
}

async function dropAllTables(client: PoolClient): Promise<void> {
  await client.query(`
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS workflow_modifications CASCADE;
    DROP TABLE IF EXISTS ai_model_configs CASCADE;
    DROP TABLE IF EXISTS model_providers CASCADE;
    DROP TABLE IF EXISTS delivery_jobs CASCADE;
    DROP TABLE IF EXISTS review_tasks CASCADE;
    DROP TABLE IF EXISTS workflow_node_runs CASCADE;
    DROP TABLE IF EXISTS workflow_runs CASCADE;
    DROP TABLE IF EXISTS workflow_edges CASCADE;
    DROP TABLE IF EXISTS workflow_nodes CASCADE;
    DROP TABLE IF EXISTS workflow_versions CASCADE;
    DROP TABLE IF EXISTS workflows CASCADE;
    DROP TABLE IF EXISTS prompt_templates CASCADE;
    DROP TABLE IF EXISTS knowledge_chunks CASCADE;
    DROP TABLE IF EXISTS knowledge_documents CASCADE;
    DROP TABLE IF EXISTS projects CASCADE;
    DROP TABLE IF EXISTS organization_members CASCADE;
    DROP TABLE IF EXISTS organizations CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
}

export async function setupTestDatabase(): Promise<TestDatabase> {
  const connectionString =
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/agentops_test';

  pool = new Pool({ connectionString });
  setupClient = await pool.connect();

  // Clean slate
  await dropAllTables(setupClient);

  // Run migrations
  await runMigrations(setupClient);

  testDb = drizzle(setupClient, { schema });

  return {
    db: testDb,
    pool,
    cleanup: teardownTestDatabase,
  };
}

export async function teardownTestDatabase(): Promise<void> {
  if (setupClient) {
    await setupClient.query('DROP SCHEMA public CASCADE');
    await setupClient.query('CREATE SCHEMA public');
    setupClient.release();
    setupClient = null;
  }

  if (pool) {
    await pool.end();
    pool = null;
  }

  testDb = null;
}

export function getTestDb(): ReturnType<typeof drizzle> {
  if (!testDb) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return testDb;
}

// Helper to create a fresh database for each test file
export async function createTestDb(): Promise<TestDatabase> {
  return setupTestDatabase();
}

// Mock the db export for when tests don't need real DB
export const mockDb = {
  query: {},
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([]),
  all: vi.fn().mockResolvedValue([]),
};
