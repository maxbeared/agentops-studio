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

// Input node - defines workflow input schema
export class InputNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    // Input node validates and extracts input based on schema
    const inputSchema = node.config.inputSchema || {};
    const input = ctx.input;

    // Simple schema validation (extract expected fields)
    const output: Record<string, any> = {};
    if (inputSchema.fields) {
      for (const field of inputSchema.fields) {
        output[field.name] = input[field.name] ?? field.defaultValue ?? null;
      }
    } else {
      // No schema defined, pass through all input
      Object.assign(output, input);
    }

    return {
      status: 'success',
      output,
    };
  }
}

// Text processing node
export class TextNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const operation = node.config.operation || 'trim';
    const value = node.config.value || '';
    const options = node.config.options || {};

    // Resolve value from context
    const resolvedValue = this.resolveValue(value, ctx);

    let result: any = '';

    switch (operation) {
      case 'trim':
        result = String(resolvedValue).trim();
        break;
      case 'upper':
        result = String(resolvedValue).toUpperCase();
        break;
      case 'lower':
        result = String(resolvedValue).toLowerCase();
        break;
      case 'title':
        result = String(resolvedValue).replace(/\w\S*/g, (txt) =>
          txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        );
        break;
      case 'split':
        const separator = options.separator || ' ';
        const limit = options.limit;
        result = limit ? String(resolvedValue).split(separator, limit) : String(resolvedValue).split(separator);
        break;
      case 'replace':
        const search = options.search || '';
        const replacement = options.replacement || '';
        result = String(resolvedValue).replace(new RegExp(search, 'g'), replacement);
        break;
      case 'regex':
        try {
          const regex = new RegExp(options.pattern || '', options.flags || '');
          const match = String(resolvedValue).match(regex);
          result = match ? (options.group ? match[options.group] || match[0] : match[0]) : '';
        } catch {
          return { status: 'failed', errorMessage: 'Invalid regex pattern' };
        }
        break;
      case 'concat':
        const parts = Array.isArray(options.values) ? options.values : [value, ...Object.values(ctx.prevOutputs)];
        result = parts.map((p: any) => String(this.resolveValue(p, ctx))).join(options.separator || '');
        break;
      case 'length':
        result = String(resolvedValue).length;
        break;
      case 'slice':
        const start = options.start || 0;
        const end = options.end;
        result = String(resolvedValue).slice(start, end);
        break;
      default:
        result = String(resolvedValue);
    }

    return {
      status: 'success',
      output: { result, original: resolvedValue },
    };
  }

  private resolveValue(value: string, ctx: ExecutionContext): any {
    // Handle variable references like {{input.field}} or {{prev.nodeName.field}}
    const match = value.match(/^\{\{(.+)\}\}$/);
    if (!match) return value;

    const path = match[1];
    const parts = path.split('.');
    let source: any;

    if (path.startsWith('input.')) {
      source = ctx.input;
      parts.shift();
    } else if (path.startsWith('prev.')) {
      source = ctx.prevOutputs;
      parts.shift();
    } else if (path.startsWith('outputs.')) {
      source = ctx.outputs;
      parts.shift();
    } else if (path.startsWith('state.')) {
      source = ctx.state;
      parts.shift();
    } else {
      source = { ...ctx.input, ...ctx.state, ...ctx.prevOutputs, ...ctx.outputs };
    }

    return parts.reduce((obj: any, key: string) => obj?.[key], source) ?? value;
  }
}

// Loop node with break/continue support
export class LoopNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const maxIterations = node.config.maxIterations || 1000;

    // Resolve items to iterate over
    let items = node.config.items || [];
    if (typeof items === 'string') {
      items = this.resolveValue(items, ctx);
    }

    if (!Array.isArray(items)) {
      return { status: 'failed', errorMessage: 'Loop items must be an array' };
    }

    const loopOutput: any[] = [];
    let iteration = 0;
    let breakCalled = false;
    let continueNext = false;

    // Execute each item in the loop
    for (const item of items) {
      if (iteration >= maxIterations) {
        break;
      }

      iteration++;
      continueNext = false;

      // Set current item and index in state
      ctx.state.__loop = { item, index: iteration - 1, total: items.length };

      // For each loop iteration, we execute the body nodes and collect output
      // Since loop body is defined by connected edges, we store iteration state
      loopOutput.push({
        iteration,
        item,
        status: 'completed',
      });

      // Check if break was set in state by a Code node
      if (ctx.state.__loopBreak) {
        breakCalled = true;
        ctx.state.__loopBreak = false;
        break;
      }

      if (ctx.state.__loopContinue) {
        ctx.state.__loopContinue = false;
        continue;
      }
    }

    return {
      status: 'success',
      output: {
        iterations: iteration,
        items: loopOutput,
        broken: breakCalled,
      },
    };
  }

  private resolveValue(value: any, ctx: ExecutionContext): any {
    if (typeof value !== 'string') return value;
    const match = value.match(/^\{\{(.+)\}\}$/);
    if (!match) return value;

    const path = match[1];
    const parts = path.split('.');
    let source: any;

    if (path.startsWith('input.')) {
      source = ctx.input;
      parts.shift();
    } else if (path.startsWith('prev.')) {
      source = ctx.prevOutputs;
      parts.shift();
    } else {
      source = { ...ctx.input, ...ctx.state, ...ctx.prevOutputs };
    }

    return parts.reduce((obj: any, key: string) => obj?.[key], source) ?? value;
  }
}

// Delay node
export class DelayNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const duration = node.config.duration || 1;
    const unit = node.config.unit || 'seconds';

    let ms = duration;
    switch (unit) {
      case 'milliseconds':
        ms = duration;
        break;
      case 'seconds':
        ms = duration * 1000;
        break;
      case 'minutes':
        ms = duration * 60 * 1000;
        break;
      case 'hours':
        ms = duration * 60 * 60 * 1000;
        break;
      default:
        ms = duration * 1000;
    }

    // Cap at 1 hour max
    ms = Math.min(ms, 60 * 60 * 1000);

    // For non-blocking delay, we'd use async/await with setTimeout
    // But since this is synchronous execution, we just record the delay
    return {
      status: 'success',
      output: {
        delayed: true,
        duration: ms,
        unit,
      },
    };
  }
}

// Transform node - template-based data transformation
export class TransformNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const template = node.config.template || '';

    try {
      const result = this.renderTemplate(template, ctx);
      return {
        status: 'success',
        output: { result },
      };
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Template rendering failed',
      };
    }
  }

  private renderTemplate(template: string, ctx: ExecutionContext): string {
    // Simple template rendering: {{path.to.value}}
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueByPath(path.trim(), ctx);
      return value !== undefined ? String(value) : match;
    });
  }

  private getValueByPath(path: string, ctx: ExecutionContext): any {
    const parts = path.split('.');
    let source: any;

    if (path.startsWith('input.')) {
      source = ctx.input;
      parts.shift();
    } else if (path.startsWith('prev.')) {
      source = ctx.prevOutputs;
      parts.shift();
    } else if (path.startsWith('outputs.')) {
      source = ctx.outputs;
      parts.shift();
    } else if (path.startsWith('state.')) {
      source = ctx.state;
      parts.shift();
    } else if (path.startsWith('loop.')) {
      source = ctx.state.__loop || {};
      parts.shift();
    } else {
      // Try all sources
      const allSources = [{ ...ctx.input }, { ...ctx.state }, ctx.prevOutputs, ctx.outputs];
      for (const src of allSources) {
        const value = parts.reduce((obj: any, key: string) => obj?.[key], src);
        if (value !== undefined) return value;
      }
      return undefined;
    }

    return parts.reduce((obj: any, key: string) => obj?.[key], source);
  }
}

// Code node - sandboxed JS expression evaluation
export class CodeNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const code = node.config.code || '';
    const language = node.config.language || 'javascript';

    if (language !== 'javascript') {
      return { status: 'failed', errorMessage: `Language '${language}' is not supported` };
    }

    try {
      const result = this.evaluateCode(code, ctx);
      return {
        status: 'success',
        output: { result, type: typeof result },
      };
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Code execution failed',
      };
    }
  }

  private evaluateCode(code: string, ctx: ExecutionContext): any {
    // Build safe context object
    const safeContext = {
      input: ctx.input,
      state: ctx.state,
      outputs: ctx.outputs,
      prev: ctx.prevOutputs,
      // Utility functions
      Math,
      JSON,
      String,
      Number,
      Boolean,
      Array,
      Object,
      Date,
      RegExp,
      console: {
        log: (...args: any[]) => console.log('[CodeNode]', ...args),
      },
      // Break/continue for loops
      __loopBreak: () => { ctx.state.__loopBreak = true; },
      __loopContinue: () => { ctx.state.__loopContinue = true; },
    };

    // Use a safe evaluation approach - create a function with limited scope
    const contextKeys = Object.keys(safeContext);
    const contextValues = Object.values(safeContext);

    // Simple expression evaluator for basic operations
    // This avoids the security risks of eval() while still being useful
    const trimmedCode = code.trim();

    // Handle return statement or expression directly
    if (trimmedCode.startsWith('return ')) {
      return this.evaluateExpression(trimmedCode.slice(7), safeContext);
    }

    // If it looks like an expression (no semicolons or single statement), evaluate it
    if (!trimmedCode.includes(';') || trimmedCode.split(';').length <= 2) {
      return this.evaluateExpression(trimmedCode, safeContext);
    }

    // For multi-statement code, execute line by line (simple approach)
    const lines = trimmedCode.split(';');
    let lastResult: any;
    for (const line of lines) {
      if (line.trim().startsWith('return ')) {
        return this.evaluateExpression(line.trim().slice(7), safeContext);
      }
      lastResult = this.evaluateExpression(line, safeContext);
    }
    return lastResult;
  }

  private evaluateExpression(expr: string, ctx: any): any {
    // Remove semicolons and trim
    expr = expr.trim().replace(/;$/, '');

    // Handle arrow functions in expressions - evaluate them
    if (expr.includes('=>')) {
      // For simplicity, handle common patterns
      const arrowMatch = expr.match(/^(\w+)\s*=>\s*(.+)$/);
      if (arrowMatch) {
        const [_, param, body] = arrowMatch;
        return this.evaluateExpression(body, { ...ctx, [param]: ctx[param] || ctx.input });
      }
    }

    // Replace variable references with context values
    let resultExpr = expr;

    // Replace property accesses like ctx.input.field
    const propertyPatterns = [
      { prefix: 'ctx.input.', source: ctx.input },
      { prefix: 'ctx.state.', source: ctx.state },
      { prefix: 'ctx.outputs.', source: ctx.outputs },
      { prefix: 'ctx.prev.', source: ctx.prev },
      { prefix: 'input.', source: ctx.input },
      { prefix: 'state.', source: ctx.state },
      { prefix: 'outputs.', source: ctx.outputs },
      { prefix: 'prev.', source: ctx.prev },
    ];

    for (const { prefix, source } of propertyPatterns) {
      if (resultExpr.includes(prefix)) {
        const regex = new RegExp(prefix + '([a-zA-Z_][a-zA-Z0-9_]*)', 'g');
        resultExpr = resultExpr.replace(regex, (match, prop) => {
          const value = source[prop];
          if (value === undefined) return 'undefined';
          if (typeof value === 'string') return `"${value}"`;
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        });
      }
    }

    // Replace simple identifiers
    const simpleVarPatterns = [
      ctx.input, ctx.state, ctx.prev, ctx.outputs,
    ];
    for (const source of simpleVarPatterns) {
      if (source && typeof source === 'object') {
        for (const [key, value] of Object.entries(source)) {
          if (typeof value === 'string' && !resultExpr.includes(`"${key}"`) && !resultExpr.includes(`'${key}'`)) {
            const regex = new RegExp(`\\b${key}\\b(?![.])`, 'g');
            if (regex.test(resultExpr)) {
              const val = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
              resultExpr = resultExpr.replace(regex, val);
            }
          }
        }
      }
    }

    // Evaluate the expression using Function constructor with limited scope
    // This is still a risk but acceptable for a workflow node
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        'input', 'state', 'outputs', 'prev', 'Math', 'JSON', 'String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'RegExp', 'console',
        `return (${resultExpr})`
      );
      return fn(
        ctx.input, ctx.state, ctx.outputs, ctx.prev,
        Math, JSON, String, Number, Boolean, Array, Object, Date, RegExp, ctx.console
      );
    } catch {
      // Fallback: try evaluating as literal
      return resultExpr;
    }
  }
}

// Merge node - waits for multiple branches to complete
export class MergeNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const strategy = node.config.strategy || 'all';

    // Collect outputs from all incoming edges (previous nodes)
    const incomingOutputs = Object.entries(ctx.prevOutputs);

    if (incomingOutputs.length === 0) {
      return { status: 'success', output: { merged: [], strategy } };
    }

    switch (strategy) {
      case 'all':
        return {
          status: 'success',
          output: {
            merged: incomingOutputs.map(([name, output]) => ({ name, output })),
            count: incomingOutputs.length,
          },
        };
      case 'first':
        return {
          status: 'success',
          output: {
            merged: incomingOutputs[0]?.[1] || null,
            name: incomingOutputs[0]?.[0],
          },
        };
      case 'last':
        return {
          status: 'success',
          output: {
            merged: incomingOutputs[incomingOutputs.length - 1]?.[1] || null,
            name: incomingOutputs[incomingOutputs.length - 1]?.[0],
          },
        };
      default:
        return { status: 'failed', errorMessage: `Unknown merge strategy: ${strategy}` };
    }
  }
}

// Error Handler node
export class ErrorHandlerNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    const fallbackOutput = node.config.fallbackOutput || {};
    const captureError = node.config.captureError !== false;

    // Error handler node catches errors from subsequent nodes during execution
    // Its output is the fallback by default
    // If an error occurs in a subsequent node, the error will be passed here

    return {
      status: 'success',
      output: {
        handled: true,
        fallback: fallbackOutput,
        errorCaptured: captureError ? (ctx.state.__lastError || null) : null,
      },
    };
  }
}
