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
  source: 'manual' | 'ai_generated' | 'ai_modified';
  aiPrompt?: string;
  aiResponse?: Record<string, any>;
  parentVersionId?: string;
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

// Review node configuration
export type ReviewNodeConfig = {
  reviewMode: 'manual' | 'ai';
  reviewPrompt?: string;
  assigneeUserId?: string;
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
  status: 'pending' | 'interpreting' | 'planning' | 'executing' | 'ai_reviewing' | 'waiting_review' | 'success' | 'failed' | 'cancelled';
  inputPayload?: Record<string, any>;
  outputPayload?: Record<string, any>;
  interpretationPrompt?: string;
  executionPlan?: ExecutionPlan;
  startedAt?: Date;
  finishedAt?: Date;
  errorMessage?: string;
  totalTokens?: number;
  totalCost?: number;
  createdAt: Date;
};

// AI Execution Plan types
export type ExecutionPlan = {
  steps: ExecutionStep[];
  reasoning: string;
};

export type ExecutionStep = {
  stepId: string;
  order: number;
  nodeId?: string;
  nodeName: string;
  description: string;
  action: 'llm' | 'retrieval' | 'webhook' | 'code' | 'output' | 'ai_review';
  input: Record<string, any>;
  dependsOn: string[];
};

// AI Workflow Generation types
export type AIWorkflowGenerateRequest = {
  projectId: string;
  description: string;
  context?: {
    knowledgeBaseIds?: string[];
  };
  modelConfig?: AIModelConfig;
};

export type AIWorkflowGenerateResponse = {
  workflow: {
    name: string;
    description: string;
    definition: WorkflowDefinition;
  };
  explanation: string;
  confidence: number;
};

// AI Workflow Modification types
export type AIWorkflowModifyRequest = {
  workflowId: string;
  workflowVersionId: string;
  currentDefinition: WorkflowDefinition;
  modifications: {
    targetNodes?: string[];
    selectionArea?: { x: number; y: number; width: number; height: number };
  };
  instruction: string;
  modelConfig?: AIModelConfig;
};

export type AIWorkflowModifyResponse = {
  modified: WorkflowDefinition;
  changes: WorkflowChange[];
  explanation: string;
};

export type WorkflowChange = {
  nodeId: string;
  type: 'added' | 'modified' | 'deleted';
  before?: Partial<WorkflowNode>;
  after?: Partial<WorkflowNode>;
  description: string;
};

// AI Run Interpret types
export type AIRunInterpretRequest = {
  workflowVersionId: string;
  inputPayload: Record<string, any>;
  options: {
    generatePlan: boolean;
    simulateOnly: boolean;
  };
  modelConfig?: AIModelConfig;
};

export type AIRunInterpretResponse = {
  executionPlan: {
    steps: ExecutionStep[];
    totalEstimatedTokens: number;
  };
  nodeExplanations: Record<string, string>;
  runId?: string;
};

// AI Model Configuration
export type AIModelConfig = {
  provider: 'openai' | 'anthropic' | 'custom';
  apiEndpoint?: string;
  apiKey?: string;
  defaultModel: string;
};

export type AIModelProviderConfig = {
  id: string;
  orgId: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  apiEndpoint?: string;
  apiKey?: string;
  defaultModel: string;
  isDefault: boolean;
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
