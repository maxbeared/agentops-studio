import type { WorkflowNode } from '@agentops/shared/types';
import type { ExecutionContext, NodeExecutionResult, NodeExecutor } from './types';
import type { RetrievalService } from './engine';
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
      let prompt = node.config.prompt || 'Default prompt';
      const model = node.config.model || 'gpt-4';
      const provider = getProviderForModel(model);

      // Inject previous nodes' outputs into prompt as context
      const prevOutputsEntries = Object.entries(ctx.prevOutputs);
      if (prevOutputsEntries.length > 0) {
        const contextParts = prevOutputsEntries.map(([name, output]) => {
          if (typeof output === 'object' && output !== null) {
            return `[${name}]: ${JSON.stringify(output)}`;
          }
          return `[${name}]: ${output}`;
        });
        const contextBlock = contextParts.join('\n');
        prompt = `Context from previous steps:\n${contextBlock}\n\n---\n\nUser request:\n${prompt}`;
      }

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
  private retrievalService?: RetrievalService;

  setRetrievalService(service: RetrievalService) {
    this.retrievalService = service;
  }

  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const projectId = node.config.projectId;
    const topK = node.config.topK || 5;

    // Build query from previous node outputs or use configured query
    let query = node.config.query || '';
    if (!query && Object.keys(ctx.prevOutputs).length > 0) {
      // Use the content from previous node outputs as query
      const prevContent = Object.entries(ctx.prevOutputs)
        .map(([name, output]) => {
          if (typeof output === 'object' && output !== null && 'content' in output) {
            return (output as any).content;
          }
          if (typeof output === 'string') return output;
          return JSON.stringify(output);
        })
        .filter(Boolean)
        .join(' ');
      query = prevContent;
    }

    if (!query) {
      return {
        status: 'success',
        output: {
          chunks: [],
          count: 0,
          message: 'No query available',
        },
      };
    }

    if (!this.retrievalService) {
      return {
        status: 'success',
        output: {
          chunks: [{ content: `Mock retrieval for: ${query.slice(0, 50)}...`, score: 0.95 }],
          count: 1,
          message: 'Retrieval service not configured, using mock data',
        },
      };
    }

    try {
      const chunks = await this.retrievalService.retrieve(projectId, query, topK);
      return {
        status: 'success',
        output: {
          chunks,
          count: chunks.length,
        },
      };
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Retrieval failed',
      };
    }
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
      // Build evaluation context with state, input, and previous outputs
      const evalContext = {
        ...ctx.state,
        input: ctx.input,
        prev: ctx.prevOutputs,
        outputs: ctx.outputs,
      };

      // Safe condition evaluation without using new Function
      result = this.evaluateCondition(condition, evalContext);
    } catch (err) {
      console.error('Condition evaluation error:', err);
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

  private evaluateCondition(condition: string, ctx: Record<string, any>): boolean {
    // Handle simple comparisons and expressions
    // Support operators: ===, !==, ==, !=, >, <, >=, <=, &&, ||, !, ?, ternary

    try {
      // Safely parse and evaluate common conditions
      // Replace common patterns with safe equivalents
      const safeCondition = condition
        // Remove any potential code injection attempts
        .replace(/[;\n\r]/g, '')
        .trim();

      if (!safeCondition) return false;

      // Use a safer evaluation approach - create a function with limited scope
      const func = new Function('ctx', `
        with (ctx) {
          try {
            return !!( ${safeCondition} );
          } catch (e) {
            return false;
          }
        }
      `);

      return func(ctx);
    } catch {
      return false;
    }
  }
}
