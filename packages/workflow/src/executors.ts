import type { WorkflowNode } from '@agentops/shared/types';
import type { ExecutionContext, NodeExecutionResult, NodeExecutor } from './types';
import { createLLMProvider, OpenAIProvider, AnthropicProvider, MockLLMProvider } from '@agentops/ai';

function getProviderForModel(model: string) {
  if (model.startsWith('claude-')) {
    return createLLMProvider('anthropic', process.env.ANTHROPIC_API_KEY);
  }
  if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) {
    return createLLMProvider('openai', process.env.OPENAI_API_KEY);
  }
  return new MockLLMProvider();
}

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
      const provider = getProviderForModel(model);
      
      const result = await provider.generate({
        prompt,
        model,
        temperature: node.config.temperature ?? 0.7,
        systemPrompt: node.config.systemPrompt,
      });

      return {
        status: 'success',
        output: {
          content: result.content,
          usage: result.usage,
          latencyMs: result.latencyMs,
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
    const knowledgeBaseId = node.config.knowledgeBaseId;
    const topK = node.config.topK || 5;
    
    return {
      status: 'success',
      output: {
        chunks: knowledgeBaseId
          ? [{ content: `Retrieved from ${knowledgeBaseId}`, score: 0.95 }]
          : [],
        count: 0,
      },
    };
  }
}

export class OutputNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    return {
      status: 'success',
      output: JSON.parse(JSON.stringify(ctx.outputs)),
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

    try {
      const response = await fetch(url, {
        method: node.config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ctx.state),
      });

      return {
        status: 'success',
        output: {
          sent: true,
          url,
          statusCode: response.status,
        },
      };
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Webhook failed',
      };
    }
  }
}

export class ConditionNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const condition = node.config.condition || 'true';
    
    let result = false;
    try {
      const evalContext = { ...ctx.state, input: ctx.input };
      result = new Function('ctx', `with(ctx) { return ${condition}; }`)(evalContext);
    } catch {
      result = false;
    }
    
    return {
      status: 'success',
      output: {
        conditionMet: result,
        path: result ? 'yes' : 'no',
      },
    };
  }
}
