import type { WorkflowDefinition, WorkflowNode } from '@agentops/shared/types';

export type ExecutionContext = {
  input: Record<string, any>;
  state: Record<string, any>;
};

export type NodeExecutionResult = {
  status: 'success' | 'failed' | 'waiting_review';
  output?: Record<string, any>;
  errorMessage?: string;
};

export interface NodeExecutor {
  execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult>;
}

export type WorkflowExecutionResult = {
  status: 'success' | 'failed' | 'waiting_review';
  outputs: Record<string, any>;
};
