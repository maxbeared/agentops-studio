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

// Retrieval service interface for knowledge base queries
export type RetrievalService = {
  retrieve(projectId: string, query: string, topK: number): Promise<Array<{ content: string; score: number; metadata?: Record<string, unknown> }>>;
};

export class WorkflowEngine {
  private executors: Map<string, NodeExecutor>;
  private listener?: NodeExecutionListener;
  private retrievalService?: RetrievalService;

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

  setRetrievalService(service: RetrievalService) {
    this.retrievalService = service;
    // Pass service to retrieval executor
    const retrievalExecutor = this.executors.get('retrieval') as RetrievalNodeExecutor;
    if (retrievalExecutor && 'setRetrievalService' in retrievalExecutor) {
      (retrievalExecutor as any).setRetrievalService(service);
    }
  }

  async execute(definition: WorkflowDefinition, input: Record<string, any>): Promise<WorkflowExecutionResult> {
    const ctx: ExecutionContext = {
      input,
      state: { ...input },
      outputs: {},
      prevOutputs: {},
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

  /**
   * Resume workflow execution from a specific node with existing context.
   * Used when a workflow pauses at a review node and is later approved.
   */
  async executeFrom(
    definition: WorkflowDefinition,
    nodeId: string,
    ctx: ExecutionContext
  ): Promise<WorkflowExecutionResult> {
    const resumeNode = definition.nodes.find((n) => n.id === nodeId);
    if (!resumeNode) {
      return {
        status: 'failed',
        outputs: { ...ctx.outputs, error: `Node ${nodeId} not found` },
      };
    }

    try {
      // Ensure the review node's output is in ctx.outputs if not already
      // The approved output should already be in ctx.outputs, but if resuming
      // directly we need to ensure it's set
      if (!ctx.outputs[nodeId] && resumeNode.type === 'review') {
        ctx.outputs[nodeId] = ctx.state;
      }

      // Execute from the next nodes after the review node
      const nextEdges = definition.edges.filter((e) => e.source === nodeId);
      for (const edge of nextEdges) {
        const nextNode = definition.nodes.find((n) => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(ctx, nextNode, definition);
        }
      }

      return {
        status: 'success',
        outputs: ctx.outputs,
      };
    } catch (error) {
      return {
        status: 'failed',
        outputs: {
          ...ctx.outputs,
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

    // Collect previous nodes' outputs for context
    const incomingEdges = definition.edges.filter((e) => e.target === node.id);
    ctx.prevOutputs = {};
    for (const edge of incomingEdges) {
      const sourceNode = definition.nodes.find((n) => n.id === edge.source);
      if (sourceNode && ctx.outputs[edge.source]) {
        ctx.prevOutputs[sourceNode.name] = ctx.outputs[edge.source];
      }
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

    // For condition nodes, only follow the edge matching the condition result
    let nextEdges = definition.edges.filter((e) => e.source === node.id);

    if (node.type === 'condition') {
      const conditionOutput = ctx.outputs[node.id];
      const conditionPath = conditionOutput?.path; // 'yes' or 'no'

      if (conditionPath) {
        // Filter edges to only follow the one matching the condition result
        // Edge sourceHandle should match the path ('yes' or 'no')
        nextEdges = nextEdges.filter((e) => {
          // The edge's sourceHandle in React Flow corresponds to the handle ID
          const edgeHandle = (e as any).sourceHandle;
          return edgeHandle === conditionPath || (!edgeHandle && conditionPath === 'yes');
        });

        // If no edges match (e.g., no explicit handle set), default to first edge
        if (nextEdges.length === 0 && definition.edges.filter((e) => e.source === node.id).length > 0) {
          nextEdges = [definition.edges.filter((e) => e.source === node.id)[0]];
        }
      }
    }

    for (const edge of nextEdges) {
      const nextNode = definition.nodes.find((n) => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(ctx, nextNode, definition);
      }
    }
  }
}
