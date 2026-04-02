import type { WorkflowDefinition, WorkflowNode } from '@agentops/shared/types';

export type ExecutionContext = {
  input: Record<string, any>;
  state: Record<string, any>;
  outputs: Record<string, any>;
  prevOutputs: Record<string, any>;
};

export type NodeExecutionResult = {
  status: 'success' | 'failed' | 'waiting_review';
  output?: Record<string, any>;
  errorMessage?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    cost?: number;
  };
  latencyMs?: number;
};

export interface NodeExecutor {
  execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult>;
}

export type WorkflowExecutionResult = {
  status: 'success' | 'failed' | 'waiting_review';
  outputs: Record<string, any>;
};

export type NodeExecutionListener = (
  nodeKey: string,
  nodeType: string,
  status: 'pending' | 'running' | 'success' | 'failed' | 'waiting_review',
  result?: NodeExecutionResult
) => Promise<void>;

export type RetrievalService = {
  retrieve(projectId: string, query: string, topK: number): Promise<Array<{
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>>;
};
