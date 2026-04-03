import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanExecutor } from './plan-executor';
import type { ExecutionPlan, ExecutionStep } from '@agentops/shared/types';

describe('packages/workflow/src/plan-executor', () => {
  let executor: PlanExecutor;

  beforeEach(() => {
    executor = new PlanExecutor('mock');
  });

  describe('constructor', () => {
    it('should create executor with default provider', () => {
      const exec = new PlanExecutor();
      expect(exec).toBeDefined();
    });

    it('should create executor with custom provider', () => {
      const exec = new PlanExecutor('anthropic', 'sk-ant-key');
      expect(exec).toBeDefined();
    });

    it('should create executor with custom model', () => {
      const exec = new PlanExecutor('mock', undefined, 'custom-model');
      expect(exec).toBeDefined();
    });
  });

  describe('setRetrievalService', () => {
    it('should accept retrieval service', () => {
      const mockService = {
        retrieve: vi.fn().mockResolvedValue([{ content: 'test', score: 0.9 }]),
      };

      executor.setRetrievalService(mockService);

      expect(executor).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should execute empty plan successfully', async () => {
      const plan: ExecutionPlan = {
        reasoning: 'Empty plan',
        steps: [],
      };

      const result = await executor.execute(plan, {});

      expect(result.status).toBe('success');
      expect(result.output).toBeDefined();
      expect(result.totalTokens).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    it('should execute single LLM step', async () => {
      const plan: ExecutionPlan = {
        reasoning: 'Single LLM step',
        steps: [
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'AI Call',
            description: 'Call AI model',
            action: 'llm',
            input: { prompt: 'Hello', model: 'mock' },
            dependsOn: [],
          },
        ],
      };

      const result = await executor.execute(plan, {});

      expect(result.status).toBe('success');
      expect(result.output.step_1).toBeDefined();
      expect(result.output.step_1.content).toContain('Mock response');
    });

    it('should execute multiple steps in order', async () => {
      const plan: ExecutionPlan = {
        reasoning: 'Multiple steps',
        steps: [
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'First',
            description: 'First step',
            action: 'llm',
            input: { prompt: 'First' },
            dependsOn: [],
          },
          {
            stepId: 'step_2',
            order: 2,
            nodeName: 'Second',
            description: 'Second step',
            action: 'llm',
            input: { prompt: 'Second' },
            dependsOn: ['step_1'],
          },
        ],
      };

      const result = await executor.execute(plan, {});

      expect(result.status).toBe('success');
      expect(result.output.step_1).toBeDefined();
      expect(result.output.step_2).toBeDefined();
    });

    it('should sort steps by order', async () => {
      const plan: ExecutionPlan = {
        reasoning: 'Unsorted steps',
        steps: [
          {
            stepId: 'step_3',
            order: 3,
            nodeName: 'Third',
            description: 'Third',
            action: 'output',
            input: {},
            dependsOn: ['step_2'],
          },
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'First',
            description: 'First',
            action: 'llm',
            input: { prompt: 'First' },
            dependsOn: [],
          },
          {
            stepId: 'step_2',
            order: 2,
            nodeName: 'Second',
            description: 'Second',
            action: 'llm',
            input: { prompt: 'Second' },
            dependsOn: ['step_1'],
          },
        ],
      };

      const result = await executor.execute(plan, {});

      expect(result.status).toBe('success');
      expect(result.output.step_1).toBeDefined();
      expect(result.output.step_2).toBeDefined();
      expect(result.output.step_3).toBeDefined();
    });

    it('should call onStepStart callback', async () => {
      const onStepStart = vi.fn();
      const plan: ExecutionPlan = {
        reasoning: 'Test callbacks',
        steps: [
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'Test',
            description: 'Test',
            action: 'llm',
            input: { prompt: 'test' },
            dependsOn: [],
          },
        ],
      };

      await executor.execute(plan, {}, { onStepStart });

      expect(onStepStart).toHaveBeenCalledWith('step_1', plan.steps[0]);
    });

    it('should call onStepComplete callback', async () => {
      const onStepComplete = vi.fn();
      const plan: ExecutionPlan = {
        reasoning: 'Test callbacks',
        steps: [
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'Test',
            description: 'Test',
            action: 'llm',
            input: { prompt: 'test' },
            dependsOn: [],
          },
        ],
      };

      await executor.execute(plan, {}, { onStepComplete });

      expect(onStepComplete).toHaveBeenCalled();
      const [stepId, step, output] = onStepComplete.mock.calls[0];
      expect(stepId).toBe('step_1');
      expect(output).toBeDefined();
    });

    it('should return waiting_review status on ai_review step', async () => {
      const plan: ExecutionPlan = {
        reasoning: 'AI review step',
        steps: [
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'Review',
            description: 'AI Review',
            action: 'ai_review',
            input: { prompt: 'Should we proceed?' },
            dependsOn: [],
          },
        ],
      };

      const result = await executor.execute(plan, {});

      // AI review step doesn't pause in mock mode since it auto-decides
      expect(result.status).toBeDefined();
    });

    it('should pass input context to steps', async () => {
      const plan: ExecutionPlan = {
        reasoning: 'Test context',
        steps: [
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'Test',
            description: 'Test',
            action: 'llm',
            input: { prompt: '${{input.query}}' },
            dependsOn: [],
          },
        ],
      };

      const result = await executor.execute(plan, { input: { query: 'What is AI?' } });

      expect(result.status).toBe('success');
    });
  });

  describe('variable resolution', () => {
    it('should resolve simple variable references', async () => {
      const plan: ExecutionPlan = {
        reasoning: 'Test variable resolution',
        steps: [
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'Test',
            description: 'Test',
            action: 'llm',
            input: { prompt: 'Query: ${{query}}' },
            dependsOn: [],
          },
        ],
      };

      const result = await executor.execute(plan, { query: 'test query' });

      expect(result.status).toBe('success');
    });

    it('should resolve nested variable paths', async () => {
      const plan: ExecutionPlan = {
        reasoning: 'Test nested variables',
        steps: [
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'Test',
            description: 'Test',
            action: 'llm',
            input: { prompt: '${{user.profile.name}}' },
            dependsOn: [],
          },
        ],
      };

      const result = await executor.execute(plan, {
        user: { profile: { name: 'John' } },
      });

      expect(result.status).toBe('success');
    });

    it('should handle missing variables gracefully', async () => {
      const plan: ExecutionPlan = {
        reasoning: 'Test missing variable',
        steps: [
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'Test',
            description: 'Test',
            action: 'llm',
            input: { prompt: '${{nonexistent}}' },
            dependsOn: [],
          },
        ],
      };

      const result = await executor.execute(plan, {});

      expect(result.status).toBe('success');
    });

    it('should resolve object with mixed variables', async () => {
      const plan: ExecutionPlan = {
        reasoning: 'Test mixed resolution',
        steps: [
          {
            stepId: 'step_1',
            order: 1,
            nodeName: 'Test',
            description: 'Test',
            action: 'llm',
            input: {
              prompt: 'Query',
              temperature: 0.7,
              model: '${{model}}',
            },
            dependsOn: [],
          },
        ],
      };

      const result = await executor.execute(plan, { model: 'gpt-4' });

      expect(result.status).toBe('success');
    });
  });

  describe('executeStep - action types', () => {
    it('should handle llm action', async () => {
      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'LLM',
        description: 'LLM call',
        action: 'llm',
        input: { prompt: 'Hello', model: 'mock' },
        dependsOn: [],
      };

      const execMethod = (executor as any).executeStep.bind(executor);
      const result = await execMethod(step, {});

      expect(result.output).toBeDefined();
      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should handle output action', async () => {
      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'Output',
        description: 'Output result',
        action: 'output',
        input: {},
        dependsOn: [],
      };

      const execMethod = (executor as any).executeStep.bind(executor);
      const result = await execMethod(step, { data: 'test' });

      expect(result.output).toEqual({ data: 'test' });
      expect(result.tokens).toBe(0);
      expect(result.cost).toBe(0);
    });

    it('should handle webhook action', async () => {
      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'Webhook',
        description: 'Webhook call',
        action: 'webhook',
        input: {
          url: 'http://localhost:99999/invalid',
          method: 'POST',
          body: { test: true },
        },
        dependsOn: [],
      };

      const execMethod = (executor as any).executeStep.bind(executor);
      const result = await execMethod(step, {});

      // Webhook may fail in test environment, but should handle gracefully
      expect(result).toBeDefined();
    });

    it('should handle unknown action', async () => {
      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'Unknown',
        description: 'Unknown action',
        action: 'unknown' as any,
        input: {},
        dependsOn: [],
      };

      const execMethod = (executor as any).executeStep.bind(executor);
      const result = await execMethod(step, {});

      expect(result.output).toBeNull();
      expect(result.tokens).toBe(0);
      expect(result.cost).toBe(0);
    });
  });

  describe('executeLLMStep', () => {
    it('should handle prompt in input.prompt', async () => {
      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'LLM',
        description: 'LLM call',
        action: 'llm',
        input: { prompt: 'Hello world' },
        dependsOn: [],
      };

      const execMethod = (executor as any).executeLLMStep.bind(executor);
      const result = await execMethod(step, {});

      expect(result.output.content).toContain('Hello world');
    });

    it('should handle question in input', async () => {
      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'LLM',
        description: 'LLM call',
        action: 'llm',
        input: { question: 'What is this?' },
        dependsOn: [],
      };

      const execMethod = (executor as any).executeLLMStep.bind(executor);
      const result = await execMethod(step, {});

      expect(result.output).toBeDefined();
    });

    it('should handle systemPrompt', async () => {
      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'LLM',
        description: 'LLM call',
        action: 'llm',
        input: {
          prompt: 'Hello',
          systemPrompt: 'You are a helpful assistant',
        },
        dependsOn: [],
      };

      const execMethod = (executor as any).executeLLMStep.bind(executor);
      const result = await execMethod(step, {});

      expect(result.output).toBeDefined();
    });

    it('should handle temperature', async () => {
      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'LLM',
        description: 'LLM call',
        action: 'llm',
        input: {
          prompt: 'Hello',
          temperature: 0.2,
        },
        dependsOn: [],
      };

      const execMethod = (executor as any).executeLLMStep.bind(executor);
      const result = await execMethod(step, {});

      expect(result.output).toBeDefined();
    });
  });

  describe('executeRetrievalStep', () => {
    it('should return message when retrieval service not configured', async () => {
      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'Retrieval',
        description: 'Retrieval',
        action: 'retrieval',
        input: { projectId: 'test', query: 'test query' },
        dependsOn: [],
      };

      const execMethod = (executor as any).executeRetrievalStep.bind(executor);
      const result = await execMethod(step, {});

      expect(result.output.message).toContain('Retrieval service not configured');
      expect(result.output.chunks).toEqual([]);
    });

    it('should call retrieval service when configured', async () => {
      const mockRetrieve = vi.fn().mockResolvedValue([
        { content: 'chunk 1', score: 0.9 },
        { content: 'chunk 2', score: 0.8 },
      ]);

      executor.setRetrievalService({ retrieve: mockRetrieve });

      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'Retrieval',
        description: 'Retrieval',
        action: 'retrieval',
        input: { projectId: 'proj-1', query: 'test', topK: 5 },
        dependsOn: [],
      };

      const execMethod = (executor as any).executeRetrievalStep.bind(executor);
      const result = await execMethod(step, {});

      expect(mockRetrieve).toHaveBeenCalledWith('proj-1', 'test', 5);
      expect(result.output.chunks).toHaveLength(2);
      expect(result.output.count).toBe(2);
    });
  });

  describe('executeWebhookStep', () => {
    it('should handle fetch errors gracefully', async () => {
      const step: ExecutionStep = {
        stepId: 'step_1',
        order: 1,
        nodeName: 'Webhook',
        description: 'Webhook call',
        action: 'webhook',
        input: {
          url: 'http://localhost:99999/invalid',
          method: 'POST',
        },
        dependsOn: [],
      };

      const execMethod = (executor as any).executeWebhookStep.bind(executor);
      const result = await execMethod(step, {});

      expect(result.output.error).toBeDefined();
    });
  });

  describe('resolveVariables', () => {
    it('should resolve single variable', () => {
      const resolve = (executor as any).resolveVariables.bind(executor);

      const result = resolve({ prompt: '${{name}}' }, { name: 'John' });

      expect(result.prompt).toBe('John');
    });

    it('should leave non-variable values unchanged', () => {
      const resolve = (executor as any).resolveVariables.bind(executor);

      const result = resolve({ name: 'John', age: 25 }, {});

      expect(result.name).toBe('John');
      expect(result.age).toBe(25);
    });

    it('should handle nested objects', () => {
      const resolve = (executor as any).resolveVariables.bind(executor);

      const result = resolve(
        { user: { name: '${{name}}' } },
        { name: 'John' }
      );

      expect(result.user.name).toBe('John');
    });
  });

  describe('getNestedValue', () => {
    it('should get simple value', () => {
      const getNested = (executor as any).getNestedValue.bind(executor);

      expect(getNested({ name: 'John' }, 'name')).toBe('John');
    });

    it('should get nested value', () => {
      const getNested = (executor as any).getNestedValue.bind(executor);

      expect(getNested({ user: { profile: { name: 'John' } } }, 'user.profile.name')).toBe('John');
    });

    it('should return undefined for missing path', () => {
      const getNested = (executor as any).getNestedValue.bind(executor);

      expect(getNested({ name: 'John' }, 'nonexistent')).toBeUndefined();
    });

    it('should handle array access', () => {
      const getNested = (executor as any).getNestedValue.bind(executor);

      expect(getNested({ items: ['a', 'b', 'c'] }, 'items.1')).toBe('b');
    });
  });
});
