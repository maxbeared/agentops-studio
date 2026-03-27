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
    // Safe expression evaluator that avoids code injection risks
    // Supports: ===, !==, ==, !=, >, <, >=, <=, &&, ||, !, ( ), and simple property access

    try {
      const safeCondition = condition.replace(/[;\n\r]/g, '').trim();
      if (!safeCondition) return false;

      // Tokenize the expression to safely extract values from context
      const result = this.evalExpression(safeCondition, ctx);
      return Boolean(result);
    } catch {
      return false;
    }
  }

  private evalExpression(expr: string, ctx: Record<string, any>): any {
    // Remove parentheses and evaluate recursively
    expr = expr.trim();

    // Handle parentheses groups
    if (expr.startsWith('(') && this.findMatchingParen(expr, 0) === expr.length - 1) {
      return this.evalExpression(expr.slice(1, -1), ctx);
    }

    // Handle ternary operator: condition ? trueVal : falseVal
    const ternaryIdx = this.findTernaryOp(expr);
    if (ternaryIdx !== -1) {
      const cond = this.evalExpression(expr.slice(0, ternaryIdx), ctx);
      const rest = expr.slice(ternaryIdx + 1).trim();
      const colonIdx = this.findColonOp(rest, 0);
      if (colonIdx !== -1) {
        const trueVal = this.evalExpression(rest.slice(0, colonIdx), ctx);
        const falseVal = this.evalExpression(rest.slice(colonIdx + 1), ctx);
        return cond ? trueVal : falseVal;
      }
    }

    // Handle || operator (lowest precedence)
    const orIdx = this.findOperator(expr, '||', false);
    if (orIdx !== -1) {
      return this.evalExpression(expr.slice(0, orIdx), ctx) || this.evalExpression(expr.slice(orIdx + 2), ctx);
    }

    // Handle && operator
    const andIdx = this.findOperator(expr, '&&', false);
    if (andIdx !== -1) {
      return this.evalExpression(expr.slice(0, andIdx), ctx) && this.evalExpression(expr.slice(andIdx + 2), ctx);
    }

    // Handle ! operator
    if (expr.startsWith('!')) {
      return !this.evalExpression(expr.slice(1), ctx);
    }

    // Handle comparison operators
    const compOps = ['===', '!==', '==', '!=', '>=', '<=', '>', '<'];
    for (const op of compOps) {
      const idx = this.findOperator(expr, op, true);
      if (idx !== -1) {
        const left = this.evalValue(expr.slice(0, idx), ctx);
        const right = this.evalValue(expr.slice(idx + op.length), ctx);
        switch (op) {
          case '===': return left === right;
          case '!==': return left !== right;
          case '==': return left == right;
          case '!=': return left != right;
          case '>=': return left >= right;
          case '<=': return left <= right;
          case '>': return left > right;
          case '<': return left < right;
        }
      }
    }

    // Handle simple values or property access
    return this.evalValue(expr, ctx);
  }

  private findMatchingParen(str: string, start: number): number {
    let depth = 0;
    for (let i = start; i < str.length; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  private findTernaryOp(str: string): number {
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') depth--;
      else if (str[i] === '?' && depth === 0) {
        // Make sure there's a colon after
        const rest = str.slice(i + 1);
        const colonIdx = this.findColonOp(rest, 0);
        if (colonIdx !== -1) return i;
      }
    }
    return -1;
  }

  private findColonOp(str: string, depth: number): number {
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') depth--;
      else if (str[i] === ':' && depth === 0) return i;
    }
    return -1;
  }

  private findOperator(str: string, op: string, checkParens: boolean): number {
    let depth = 0;
    for (let i = str.length - op.length; i >= 0; i--) {
      const ch = str[i];
      if (checkParens) {
        if (ch === ')') depth++;
        else if (ch === '(') depth--;
        if (depth !== 0) continue;
      }
      if (str.slice(i, i + op.length) === op) {
        // Make sure it's not part of a longer operator
        if (i > 0 && /[a-zA-Z0-9_]/.test(str[i - 1])) continue;
        if (i + op.length < str.length && /[a-zA-Z0-9_]/.test(str[i + op.length])) continue;
        // For && and ||, make sure they're not inside strings
        if ((op === '&&' || op === '||') && this.isInsideString(str, i)) continue;
        return i;
      }
    }
    return -1;
  }

  private isInsideString(str: string, idx: number): boolean {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < idx; i++) {
      if (str[i] === "'" && !inDouble) inSingle = !inSingle;
      else if (str[i] === '"' && !inSingle) inDouble = !inDouble;
    }
    return inSingle || inDouble;
  }

  private evalValue(valueStr: string, ctx: Record<string, any>): any {
    valueStr = valueStr.trim();

    // Boolean literals
    if (valueStr === 'true') return true;
    if (valueStr === 'false') return false;

    // Null/undefined
    if (valueStr === 'null') return null;
    if (valueStr === 'undefined') return undefined;

    // String literals
    if ((valueStr.startsWith('"') && valueStr.endsWith('"')) ||
        (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
      return valueStr.slice(1, -1);
    }

    // Number literals
    const num = Number(valueStr);
    if (!isNaN(num)) return num;

    // Property access: input.foo, prev.bar, outputs.baz, state.qux
    const propMatch = valueStr.match(/^(input|prev|outputs|state)\.([a-zA-Z_][a-zA-Z0-9_]*)$/);
    if (propMatch) {
      const [, prefix, prop] = propMatch;
      const source = prefix === 'prev' ? ctx.prev :
                    prefix === 'outputs' ? ctx.outputs :
                    prefix === 'state' ? ctx.state :
                    ctx.input;
      return source?.[prop];
    }

    // Simple identifier - look in all contexts
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(valueStr)) {
      if (ctx.state?.[valueStr] !== undefined) return ctx.state[valueStr];
      if (ctx.input?.[valueStr] !== undefined) return ctx.input[valueStr];
      if (ctx.prev?.[valueStr] !== undefined) return ctx.prev[valueStr];
      if (ctx.outputs?.[valueStr] !== undefined) return ctx.outputs[valueStr];
    }

    return valueStr;
  }
}
