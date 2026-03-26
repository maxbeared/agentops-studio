import type { WorkflowDefinition, WorkflowNode } from '@agentops/shared/types';
import type { ExecutionContext, NodeExecutor, WorkflowExecutionResult } from './types';
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

  async execute(definition: WorkflowDefinition, input: Record<string, any>): Promise<WorkflowExecutionResult> {
    const ctx: ExecutionContext = {
      input,
      state: { ...input },
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
        outputs: ctx.state,
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

    const result = await executor.execute(ctx, node);

    if (result.status === 'failed') {
      throw new Error(result.errorMessage || 'Node execution failed');
    }

    if (result.status === 'waiting_review') {
      ctx.state[node.id] = result.output;
      return;
    }

    ctx.state[node.id] = result.output;

    const nextEdges = definition.edges.filter((e) => e.source === node.id);
    for (const edge of nextEdges) {
      const nextNode = definition.nodes.find((n) => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(ctx, nextNode, definition);
      }
    }
  }
}
