import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  organizationId: z.string().uuid(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
});

export const createKnowledgeDocumentSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  sourceType: z.enum(['file', 'url', 'text']),
  sourceUrl: z.string().url().optional(),
  mimeType: z.string().optional(),
  content: z.string().optional(),
});

export const createWorkflowSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
});

export const publishWorkflowSchema = z.object({
  workflowId: z.string().uuid(),
  definition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
});

export const runWorkflowSchema = z.object({
  workflowVersionId: z.string().uuid(),
  inputPayload: z.record(z.any()).optional(),
});
