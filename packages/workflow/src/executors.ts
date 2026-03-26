import type { WorkflowNode } from '@agentops/shared/types';
import type { ExecutionContext, NodeExecutionResult, NodeExecutor } from './types';
import { defaultLLMProvider } from '@agentops/ai';

export class StartNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    return {
      status: 'success',
      output: ctx.input,
    };
  }
}

export class LLMNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    try {
      const prompt = node.config.prompt || 'Default prompt';
      const model = node.config.model || 'gpt-4';
      
      const result = await defaultLLMProvider.generate({
        prompt,
        model,
        temperature: node.config.temperature,
      });

      return {
        status: 'success',
        output: {
          content: result.content,
          usage: result.usage,
        },
      };
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export class RetrievalNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const query = node.config.query || ctx.state.query || '';
    
    return {
      status: 'success',
      output: {
        chunks: [
          { content: 'Mock retrieved chunk 1', score: 0.95 },
          { content: 'Mock retrieved chunk 2', score: 0.87 },
        ],
      },
    };
  }
}

export class OutputNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    return {
      status: 'success',
      output: ctx.state,
    };
  }
}

export class ReviewNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    return {
      status: 'waiting_review',
      output: ctx.state,
    };
  }
}

export class WebhookNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const url = node.config.url;
    if (!url) {
      return {
        status: 'failed',
        errorMessage: 'Webhook URL not configured',
      };
    }

    return {
      status: 'success',
      output: {
        sent: true,
        url,
      },
    };
  }
}

export class ConditionNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const condition = node.config.condition || 'true';
    const result = condition === 'true';
    
    return {
      status: 'success',
      output: {
        conditionMet: result,
      },
    };
  }
}
