import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  createKnowledgeDocumentSchema,
  createWorkflowSchema,
  publishWorkflowSchema,
  runWorkflowSchema,
} from './schemas';

describe('packages/shared/src/schemas', () => {
  describe('createProjectSchema', () => {
    it('should validate valid project data with name only', () => {
      const result = createProjectSchema.safeParse({ name: 'Test Project' });
      expect(result.success).toBe(true);
    });

    it('should validate valid project data with all fields', () => {
      const result = createProjectSchema.safeParse({
        name: 'Test Project',
        description: 'A test project description',
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createProjectSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 120 characters', () => {
      const result = createProjectSchema.safeParse({ name: 'a'.repeat(121) });
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding 1000 characters', () => {
      const result = createProjectSchema.safeParse({
        name: 'Test',
        description: 'a'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid organizationId format (not a UUID)', () => {
      const result = createProjectSchema.safeParse({
        name: 'Test',
        organizationId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid UUID for organizationId', () => {
      const result = createProjectSchema.safeParse({
        name: 'Test',
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateProjectSchema', () => {
    it('should allow empty object (no updates)', () => {
      const result = updateProjectSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate partial update with name only', () => {
      const result = updateProjectSchema.safeParse({ name: 'Updated Name' });
      expect(result.success).toBe(true);
    });

    it('should validate partial update with description only', () => {
      const result = updateProjectSchema.safeParse({ description: 'New description' });
      expect(result.success).toBe(true);
    });

    it('should allow setting description to null', () => {
      const result = updateProjectSchema.safeParse({ description: null });
      expect(result.success).toBe(true);
    });

    it('should reject empty name in update', () => {
      const result = updateProjectSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('createKnowledgeDocumentSchema', () => {
    it('should validate valid text document', () => {
      const result = createKnowledgeDocumentSchema.safeParse({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Document',
        sourceType: 'text',
        content: 'Document content here',
      });
      expect(result.success).toBe(true);
    });

    it('should validate valid URL document', () => {
      const result = createKnowledgeDocumentSchema.safeParse({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Document',
        sourceType: 'url',
        sourceUrl: 'https://example.com/article',
      });
      expect(result.success).toBe(true);
    });

    it('should validate valid file document', () => {
      const result = createKnowledgeDocumentSchema.safeParse({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Document',
        sourceType: 'file',
        mimeType: 'application/pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid sourceType', () => {
      const result = createKnowledgeDocumentSchema.safeParse({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Document',
        sourceType: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing projectId', () => {
      const result = createKnowledgeDocumentSchema.safeParse({
        title: 'Test Document',
        sourceType: 'text',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid sourceUrl format', () => {
      const result = createKnowledgeDocumentSchema.safeParse({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Document',
        sourceType: 'url',
        sourceUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createWorkflowSchema', () => {
    it('should validate valid workflow data', () => {
      const result = createWorkflowSchema.safeParse({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'My Workflow',
      });
      expect(result.success).toBe(true);
    });

    it('should validate workflow with description', () => {
      const result = createWorkflowSchema.safeParse({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'My Workflow',
        description: 'A workflow description',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const result = createWorkflowSchema.safeParse({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = createWorkflowSchema.safeParse({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid projectId format', () => {
      const result = createWorkflowSchema.safeParse({
        projectId: 'invalid-uuid',
        name: 'My Workflow',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('publishWorkflowSchema', () => {
    it('should validate valid workflow publish', () => {
      const result = publishWorkflowSchema.safeParse({
        workflowId: '123e4567-e89b-12d3-a456-426614174000',
        definition: {
          nodes: [{ id: '1', type: 'start', name: 'Start' }],
          edges: [],
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate definition with multiple nodes and edges', () => {
      const result = publishWorkflowSchema.safeParse({
        workflowId: '123e4567-e89b-12d3-a456-426614174000',
        definition: {
          nodes: [
            { id: '1', type: 'start', name: 'Start' },
            { id: '2', type: 'llm', name: 'AI Call' },
            { id: '3', type: 'output', name: 'Output' },
          ],
          edges: [
            { id: 'e1', source: '1', target: '2' },
            { id: 'e2', source: '2', target: '3' },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing workflowId', () => {
      const result = publishWorkflowSchema.safeParse({
        definition: {
          nodes: [],
          edges: [],
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing definition', () => {
      const result = publishWorkflowSchema.safeParse({
        workflowId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(false);
    });

    it('should reject definition with missing nodes array', () => {
      const result = publishWorkflowSchema.safeParse({
        workflowId: '123e4567-e89b-12d3-a456-426614174000',
        definition: {
          edges: [],
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('runWorkflowSchema', () => {
    it('should validate valid workflow run with version id', () => {
      const result = runWorkflowSchema.safeParse({
        workflowVersionId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should validate workflow run with input payload', () => {
      const result = runWorkflowSchema.safeParse({
        workflowVersionId: '123e4567-e89b-12d3-a456-426614174000',
        inputPayload: {
          userId: '123',
          query: 'What is AI?',
          options: { topK: 5 },
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing workflowVersionId', () => {
      const result = runWorkflowSchema.safeParse({
        inputPayload: { query: 'test' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid workflowVersionId format', () => {
      const result = runWorkflowSchema.safeParse({
        workflowVersionId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty inputPayload (optional)', () => {
      const result = runWorkflowSchema.safeParse({
        workflowVersionId: '123e4567-e89b-12d3-a456-426614174000',
        inputPayload: {},
      });
      expect(result.success).toBe(true);
    });
  });
});
