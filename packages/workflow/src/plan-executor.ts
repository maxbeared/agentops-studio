import type { ExecutionPlan, ExecutionStep, WorkflowDefinition } from '@agentops/shared/types';
import { createLLMProvider } from '@agentops/ai';

export type ExecutionResult = {
  status: 'success' | 'failed' | 'waiting_review' | 'ai_reviewing';
  output: Record<string, any>;
  totalTokens: number;
  totalCost: number;
  currentStep?: string;
};

export type PlanExecutorCallbacks = {
  onStepStart?: (stepId: string, step: ExecutionStep) => void;
  onStepComplete?: (stepId: string, step: ExecutionStep, result: any) => void;
  onPause?: (stepId: string, reason: string, context: Record<string, any>) => void;
  onResume?: (stepId: string, decision: any) => void;
};

const PLAN_EXECUTION_SYSTEM_PROMPT = `You are an AI execution assistant. Your task is to execute workflows by following the execution plan.

Guidelines:
1. Execute each step in order
2. Use the provided context and inputs for each step
3. Save results to context for subsequent steps
4. When encountering a review step with mode='ai', make an autonomous decision
5. Handle errors gracefully and report failures

Available actions:
- llm: Generate text using the AI model
- retrieval: Query the knowledge base
- webhook: Make HTTP requests
- code: Execute JavaScript code
- output: Final output
- ai_review: AI-powered review/decision point`;

export class PlanExecutor {
  private llmProvider: ReturnType<typeof createLLMProvider>;
  private model: string;
  private retrievalService?: {
    retrieve: (projectId: string, query: string, topK: number) => Promise<any[]>;
  };

  constructor(provider: string = 'anthropic', apiKey?: string, model?: string) {
    this.llmProvider = createLLMProvider(provider, apiKey);
    this.model = model || 'claude-3-5-sonnet-20241022';
  }

  setRetrievalService(service: typeof PlanExecutor.prototype.retrievalService) {
    this.retrievalService = service;
  }

  async execute(
    executionPlan: ExecutionPlan,
    input: Record<string, any>,
    callbacks?: PlanExecutorCallbacks
  ): Promise<ExecutionResult> {
    const context: Record<string, any> = { ...input };
    let totalTokens = 0;
    let totalCost = 0;

    const steps = executionPlan.steps.sort((a, b) => a.order - b.order);

    for (const step of steps) {
      callbacks?.onStepStart?.(step.stepId, step);

      try {
        const stepResult = await this.executeStep(step, context);
        context[step.stepId] = stepResult.output;
        totalTokens += stepResult.tokens;
        totalCost += stepResult.cost;

        callbacks?.onStepComplete?.(step.stepId, step, stepResult.output);

        // Handle pause conditions
        if (stepResult.pause) {
          callbacks?.onPause?.(step.stepId, stepResult.pauseReason || 'Review required', context);
          return {
            status: stepResult.reviewType === 'ai' ? 'ai_reviewing' : 'waiting_review',
            output: context,
            totalTokens,
            totalCost,
            currentStep: step.stepId,
          };
        }
      } catch (error) {
        return {
          status: 'failed',
          output: { ...context, error: error instanceof Error ? error.message : 'Step failed' },
          totalTokens,
          totalCost,
          currentStep: step.stepId,
        };
      }
    }

    return {
      status: 'success',
      output: context,
      totalTokens,
      totalCost,
    };
  }

  private async executeStep(
    step: ExecutionStep,
    context: Record<string, any>
  ): Promise<{ output: any; tokens: number; cost: number; pause?: boolean; pauseReason?: string; reviewType?: string }> {
    switch (step.action) {
      case 'llm':
        return this.executeLLMStep(step, context);
      case 'retrieval':
        return this.executeRetrievalStep(step, context);
      case 'webhook':
        return this.executeWebhookStep(step, context);
      case 'code':
        return this.executeCodeStep(step, context);
      case 'output':
        return { output: context, tokens: 0, cost: 0 };
      case 'ai_review':
        return this.executeAIReviewStep(step, context);
      default:
        return { output: null, tokens: 0, cost: 0 };
    }
  }

  private async executeLLMStep(
    step: ExecutionStep,
    context: Record<string, any>
  ): Promise<{ output: any; tokens: number; cost: number }> {
    const resolvedInput = this.resolveVariables(step.input, context);

    const result = await this.llmProvider.generate({
      prompt: resolvedInput.prompt || resolvedInput.question || JSON.stringify(resolvedInput),
      model: resolvedInput.model || this.model,
      temperature: resolvedInput.temperature ?? 0.7,
      systemPrompt: resolvedInput.systemPrompt,
    });

    return {
      output: { content: result.content, usage: result.usage },
      tokens: result.usage?.totalTokens ?? 0,
      cost: result.usage?.cost ?? 0,
    };
  }

  private async executeRetrievalStep(
    step: ExecutionStep,
    context: Record<string, any>
  ): Promise<{ output: any; tokens: number; cost: number }> {
    if (!this.retrievalService) {
      return { output: { chunks: [], message: 'Retrieval service not configured' }, tokens: 0, cost: 0 };
    }

    const resolvedInput = this.resolveVariables(step.input, context);

    const chunks = await this.retrievalService.retrieve(
      resolvedInput.projectId,
      resolvedInput.query,
      resolvedInput.topK || 5
    );

    return { output: { chunks, count: chunks.length }, tokens: 0, cost: 0 };
  }

  private async executeWebhookStep(
    step: ExecutionStep,
    context: Record<string, any>
  ): Promise<{ output: any; tokens: number; cost: number }> {
    const resolvedInput = this.resolveVariables(step.input, context);

    try {
      const response = await fetch(resolvedInput.url, {
        method: resolvedInput.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolvedInput.body || context),
      });

      const result = await response.json();
      return { output: { statusCode: response.status, body: result }, tokens: 0, cost: 0 };
    } catch (error) {
      return {
        output: { error: error instanceof Error ? error.message : 'Webhook failed' },
        tokens: 0,
        cost: 0,
      };
    }
  }

  private async executeCodeStep(
    step: ExecutionStep,
    context: Record<string, any>
  ): Promise<{ output: any; tokens: number; cost: number }> {
    const resolvedInput = this.resolveVariables(step.input, context);
    const code = resolvedInput.code;

    try {
      const fn = new Function('context', `return (${code})`);
      const result = fn(context);
      return { output: { result }, tokens: 0, cost: 0 };
    } catch (error) {
      return {
        output: { error: error instanceof Error ? error.message : 'Code execution failed' },
        tokens: 0,
        cost: 0,
      };
    }
  }

  private async executeAIReviewStep(
    step: ExecutionStep,
    context: Record<string, any>
  ): Promise<{ output: any; tokens: number; cost: number; pause?: boolean; pauseReason?: string; reviewType?: string }> {
    const resolvedInput = this.resolveVariables(step.input, context);

    // AI review - make autonomous decision
    const result = await this.llmProvider.generate({
      prompt: `Review the following and make a decision:

Context: ${JSON.stringify(context, null, 2)}

Review prompt: ${resolvedInput.prompt || 'Should this be approved or rejected?'}

Respond with JSON: { "decision": "approved" | "rejected", "reason": "explanation" }`,
      model: this.model,
      temperature: 0.3,
    });

    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        return {
          output: { decision: decision.decision, reason: decision.reason },
          tokens: result.usage?.totalTokens ?? 0,
          cost: result.usage?.cost ?? 0,
        };
      }
    } catch {
      // Fallback
    }

    return {
      output: { decision: 'approved', reason: 'Default approval' },
      tokens: result.usage?.totalTokens ?? 0,
      cost: result.usage?.cost ?? 0,
    };
  }

  private resolveVariables(obj: Record<string, any>, context: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.startsWith('${{') && value.endsWith('}}')) {
        const varPath = value.slice(3, -2).trim();
        resolved[key] = this.getNestedValue(context, varPath);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveVariables(value, context);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current: any, key: string) => current?.[key], obj);
  }
}

export default PlanExecutor;
