export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeDocument = {
  id: string;
  projectId: string;
  title: string;
  sourceType: 'file' | 'url' | 'text';
  sourceUrl?: string;
  fileKey?: string;
  mimeType?: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  version: number;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Workflow = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  latestVersionId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkflowVersion = {
  id: string;
  workflowId: string;
  version: number;
  definition: WorkflowDefinition;
  publishedAt?: Date;
  createdBy: string;
  createdAt: Date;
};

export type WorkflowDefinition = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type WorkflowNode = {
  id: string;
  type: 'start' | 'retrieval' | 'llm' | 'condition' | 'review' | 'webhook' | 'output' | 'input' | 'loop' | 'delay' | 'transform' | 'code' | 'merge' | 'errorHandler' | 'text';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  condition?: Record<string, any>;
};

export type WorkflowRun = {
  id: string;
  workflowVersionId: string;
  projectId: string;
  triggeredBy: string;
  triggerType: 'manual' | 'schedule' | 'api';
  status: 'pending' | 'running' | 'waiting_review' | 'success' | 'failed' | 'cancelled';
  inputPayload?: Record<string, any>;
  outputPayload?: Record<string, any>;
  startedAt?: Date;
  finishedAt?: Date;
  errorMessage?: string;
  totalTokens?: number;
  totalCost?: number;
  createdAt: Date;
};

export type WorkflowNodeRun = {
  id: string;
  workflowRunId: string;
  nodeKey: string;
  nodeType: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'waiting_review';
  inputPayload?: Record<string, any>;
  outputPayload?: Record<string, any>;
  errorMessage?: string;
  startedAt?: Date;
  finishedAt?: Date;
  durationMs?: number;
  tokenUsageInput?: number;
  tokenUsageOutput?: number;
  cost?: number;
  metadata?: Record<string, any>;
};

export type ReviewTask = {
  id: string;
  workflowRunId: string;
  workflowNodeRunId: string;
  assigneeUserId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revised';
  reviewComment?: string;
  reviewedOutput?: Record<string, any>;
  createdAt: Date;
  reviewedAt?: Date;
};
