import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: varchar('role', { length: 30 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const knowledgeDocuments = pgTable('knowledge_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  title: varchar('title', { length: 200 }).notNull(),
  sourceType: varchar('source_type', { length: 20 }).notNull(),
  sourceUrl: text('source_url'),
  fileKey: varchar('file_key', { length: 255 }),
  mimeType: varchar('mime_type', { length: 120 }),
  status: varchar('status', { length: 20 }).notNull().default('uploaded'),
  version: integer('version').notNull().default(1),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => knowledgeDocuments.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  embedding: text('embedding'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
  template: text('template').notNull(),
  inputSchema: jsonb('input_schema').$type<Record<string, unknown>>(),
  version: integer('version').notNull().default(1),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  latestVersionId: uuid('latest_version_id'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workflowVersions = pgTable('workflow_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id),
  version: integer('version').notNull(),
  definition: jsonb('definition').$type<Record<string, unknown>>().notNull(),
  source: varchar('source', { length: 20 }).notNull().default('manual'),
  aiPrompt: text('ai_prompt'),
  aiResponse: jsonb('ai_response').$type<Record<string, unknown>>(),
  parentVersionId: uuid('parent_version_id'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workflowNodes = pgTable('workflow_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowVersionId: uuid('workflow_version_id').notNull().references(() => workflowVersions.id),
  nodeKey: varchar('node_key', { length: 120 }).notNull(),
  nodeType: varchar('node_type', { length: 30 }).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  positionX: integer('position_x').notNull().default(0),
  positionY: integer('position_y').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workflowEdges = pgTable('workflow_edges', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowVersionId: uuid('workflow_version_id').notNull().references(() => workflowVersions.id),
  sourceNodeKey: varchar('source_node_key', { length: 120 }).notNull(),
  targetNodeKey: varchar('target_node_key', { length: 120 }).notNull(),
  sourceHandle: varchar('source_handle', { length: 20 }),
  conditionConfig: jsonb('condition_config').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workflowRuns = pgTable('workflow_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowVersionId: uuid('workflow_version_id').notNull().references(() => workflowVersions.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  triggeredBy: uuid('triggered_by').notNull().references(() => users.id),
  triggerType: varchar('trigger_type', { length: 20 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  inputPayload: jsonb('input_payload').$type<Record<string, unknown>>(),
  outputPayload: jsonb('output_payload').$type<Record<string, unknown>>(),
  interpretationPrompt: text('interpretation_prompt'),
  executionPlan: jsonb('execution_plan').$type<Record<string, unknown>>(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  totalTokens: integer('total_tokens').default(0),
  totalCost: numeric('total_cost', { precision: 12, scale: 6 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workflowNodeRuns = pgTable('workflow_node_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowRunId: uuid('workflow_run_id').notNull().references(() => workflowRuns.id),
  nodeKey: varchar('node_key', { length: 120 }).notNull(),
  nodeType: varchar('node_type', { length: 30 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  inputPayload: jsonb('input_payload').$type<Record<string, unknown>>(),
  outputPayload: jsonb('output_payload').$type<Record<string, unknown>>(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),
  tokenUsageInput: integer('token_usage_input').default(0),
  tokenUsageOutput: integer('token_usage_output').default(0),
  cost: numeric('cost', { precision: 12, scale: 6 }).default('0'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
});

export const reviewTasks = pgTable('review_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowRunId: uuid('workflow_run_id').notNull().references(() => workflowRuns.id),
  workflowNodeRunId: uuid('workflow_node_run_id').notNull().references(() => workflowNodeRuns.id),
  assigneeUserId: uuid('assignee_user_id').references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  reviewComment: text('review_comment'),
  reviewedOutput: jsonb('reviewed_output').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

export const deliveryJobs = pgTable('delivery_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowRunId: uuid('workflow_run_id').notNull().references(() => workflowRuns.id),
  channel: varchar('channel', { length: 30 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  responseBody: text('response_body'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
});

export const modelProviders = pgTable('model_providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  provider: varchar('provider', { length: 30 }).notNull(),
  model: varchar('model', { length: 120 }).notNull(),
  apiBase: text('api_base'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  config: jsonb('config').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Model Configurations (organization-level)
export const aiModelConfigs = pgTable('ai_model_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 20 }).notNull(),
  apiEndpoint: text('api_endpoint'),
  apiKey: text('api_key'),
  defaultModel: varchar('default_model', { length: 50 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Workflow Modifications record
export const workflowModifications = pgTable('workflow_modifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowVersionId: uuid('workflow_version_id').notNull().references(() => workflowVersions.id),
  parentVersionId: uuid('parent_version_id'),
  source: varchar('source', { length: 20 }).notNull(),
  prompt: text('prompt').notNull(),
  response: jsonb('response').$type<Record<string, unknown>>(),
  changes: jsonb('changes').$type<Record<string, unknown>>(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  action: varchar('action', { length: 120 }).notNull(),
  resourceType: varchar('resource_type', { length: 60 }).notNull(),
  resourceId: uuid('resource_id'),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  organizations: many(organizations),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  knowledgeDocuments: many(knowledgeDocuments),
  workflows: many(workflows),
}));

export const knowledgeDocumentsRelations = relations(knowledgeDocuments, ({ one, many }) => ({
  project: one(projects, {
    fields: [knowledgeDocuments.projectId],
    references: [projects.id],
  }),
  chunks: many(knowledgeChunks),
}));
