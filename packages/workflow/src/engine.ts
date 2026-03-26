import type { WorkflowDefinition, WorkflowNode } from '@agentops/shared/types';
import type { ExecutionContext, NodeExecutor, WorkflowExecutionResult, NodeExecutionListener } from './types';
import {
  StartNodeExecutor,
  LLMNodeExecutor,
  RetrievalNodeExecutor,
  OutputNodeExecutor,
  ReviewNodeExecutor,
  WebhookNodeExecutor,
  ConditionNodeExecutor,
} from './executors';

export class WorkflowEngine {
  private executors: Map<string, NodeExecutor>;
  private listener?: NodeExecutionListener;

  constructor() {
    this.executors = new Map();
    this.executors.set('start', new StartNodeExecutor());
    this.executors.set('llm', new LLMNodeExecutor());
    this.executors.set('retrieval', new RetrievalNodeExecutor());
    this.executors.set('output', new OutputNodeExecutor());
    this.executors.set('review', new ReviewNodeExecutor());
    this.executors.set('webhook', new WebhookNodeExecutor());
    this.executors.set('condition', new ConditionNodeExecutor());
  }

  setNodeExecutionListener(listener: NodeExecutionListener | undefined) {
    this.listener = listener;
  }

  async execute(definition: WorkflowDefinition, input: Record<string, any>): Promise<WorkflowExecutionResult> {
    const ctx: ExecutionContext = {
      input,
      state: { ...input },
      outputs: {},
    };

    const startNode = definition.nodes.find((n) => n.type === 'start');
    if (!startNode) {
      return {
        status: 'failed',
        outputs: { error: 'No start node found' },
      };
    }

    try {
      await this.executeNode(ctx, startNode, definition);
      
      return {
        status: 'success',
        outputs: ctx.outputs,
      };
    } catch (error) {
      return {
        status: 'failed',
        outputs: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private async executeNode(
    ctx: ExecutionContext,
    node: WorkflowNode,
    definition: WorkflowDefinition
  ): Promise<void> {
    const executor = this.executors.get(node.type);
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.type}`);
    }

    if (this.listener) {
      await this.listener(node.id, node.type, 'running');
    }

    const result = await executor.execute(ctx, node);

    if (result.status === 'failed') {
      if (this.listener) {
        await this.listener(node.id, node.type, 'failed', result);
      }
      throw new Error(result.errorMessage || 'Node execution failed');
    }

    if (result.status === 'waiting_review') {
      ctx.outputs[node.id] = result.output;
      if (this.listener) {
        await this.listener(node.id, node.type, 'waiting_review', result);
      }
      return;
    }

    ctx.outputs[node.id] = result.output;
    
    if (this.listener) {
      await this.listener(node.id, node.type, 'success', result);
    }

    const nextEdges = definition.edges.filter((e) => e.source === node.id);
    for (const edge of nextEdges) {
      const nextNode = definition.nodes.find((n) => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(ctx, nextNode, definition);
      }
    }
  }
}
