import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider, AnthropicProvider, createLLMProvider } from './providers';
import type { ModelGenerateInput, EmbeddingInput } from './types';

// Mock OpenAI SDK
const mockChatCreate = vi.fn();
const mockEmbeddingsCreate = vi.fn();

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: (...args: any[]) => mockChatCreate(...args),
      },
    };
    embeddings = {
      create: (...args: any[]) => mockEmbeddingsCreate(...args),
    };
  },
}));

// Mock Anthropic SDK
const mockMessagesCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: (...args: any[]) => mockMessagesCreate(...args),
    };
  },
}));

describe('OpenAIProvider (mocked SDK)', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider('sk-test-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate', () => {
    it('should return response from OpenAI API', async () => {
      mockChatCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Hello from GPT!' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      });

      const result = await provider.generate({
        prompt: 'Say hello',
        model: 'gpt-4',
      });

      expect(result.content).toBe('Hello from GPT!');
      expect(result.usage?.inputTokens).toBe(10);
      expect(result.usage?.outputTokens).toBe(20);
      expect(result.usage?.totalTokens).toBe(30);
      expect(result.latencyMs).toBeDefined();
      expect(typeof result.latencyMs).toBe('number');
    });

    it('should include system prompt when provided', async () => {
      mockChatCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 15, completion_tokens: 5, total_tokens: 20 },
      });

      await provider.generate({
        prompt: 'Hello',
        model: 'gpt-4',
        systemPrompt: 'You are a helpful assistant.',
      });

      expect(mockChatCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });

    it('should not include system prompt when not provided', async () => {
      mockChatCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      });

      await provider.generate({
        prompt: 'Hello',
        model: 'gpt-4',
      });

      expect(mockChatCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );

      const callMessages = mockChatCreate.mock.calls[0][0].messages;
      const hasSystem = callMessages.some((m: any) => m.role === 'system');
      expect(hasSystem).toBe(false);
    });

    it('should use default model when not specified', async () => {
      mockChatCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      });

      await provider.generate({
        prompt: 'Hello',
        model: '',
      });

      expect(mockChatCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
        })
      );
    });

    it('should handle empty response content', async () => {
      mockChatCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '' } }],
        usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
      });

      const result = await provider.generate({
        prompt: 'Hello',
        model: 'gpt-4',
      });

      expect(result.content).toBe('');
    });

    it('should handle missing choices', async () => {
      mockChatCreate.mockResolvedValueOnce({
        choices: [],
        usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
      });

      const result = await provider.generate({
        prompt: 'Hello',
        model: 'gpt-4',
      });

      expect(result.content).toBe('');
    });

    it('should handle API error gracefully', async () => {
      mockChatCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const result = await provider.generate({
        prompt: 'Hello',
        model: 'gpt-4',
      });

      expect(result.content).toContain('Error: API rate limit exceeded');
      expect(result.usage?.inputTokens).toBe(0);
      expect(result.latencyMs).toBeDefined();
    });

    it('should handle network error gracefully', async () => {
      mockChatCreate.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await provider.generate({
        prompt: 'Hello',
        model: 'gpt-4',
      });

      expect(result.content).toContain('Error');
      expect(result.usage?.cost).toBe(0);
    });

    it('should calculate cost correctly', async () => {
      mockChatCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 },
      });

      const result = await provider.generate({
        prompt: 'Hello',
        model: 'gpt-4',
      });

      // Cost = (1000 * 0.03 / 1e6) + (500 * 0.06 / 1e6)
      const expectedCost = (1000 * 0.03 / 1e6) + (500 * 0.06 / 1e6);
      expect(result.usage?.cost).toBeCloseTo(expectedCost, 10);
    });

    it('should handle missing usage data', async () => {
      mockChatCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
      });

      const result = await provider.generate({
        prompt: 'Hello',
        model: 'gpt-4',
      });

      expect(result.content).toBe('Response');
      expect(result.usage?.inputTokens).toBe(0);
      expect(result.usage?.outputTokens).toBe(0);
    });

    it('should pass temperature parameter', async () => {
      mockChatCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      });

      await provider.generate({
        prompt: 'Hello',
        model: 'gpt-4',
        temperature: 0.3,
      });

      expect(mockChatCreate).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 0.3 })
      );
    });

    it('should pass maxTokens parameter', async () => {
      mockChatCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      });

      await provider.generate({
        prompt: 'Hello',
        model: 'gpt-4',
        maxTokens: 100,
      });

      expect(mockChatCreate).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 100 })
      );
    });
  });

  describe('embed', () => {
    it('should return embedding vector from OpenAI API', async () => {
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      });

      const result = await provider.embed({ text: 'Hello' });

      expect(result.vector).toEqual([0.1, 0.2, 0.3]);
    });

    it('should handle API error gracefully', async () => {
      mockEmbeddingsCreate.mockRejectedValueOnce(new Error('API error'));

      const result = await provider.embed({ text: 'Hello' });

      expect(result.vector).toBeDefined();
      expect(result.vector).toHaveLength(1536);
    });
  });
});

describe('AnthropicProvider (mocked SDK)', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new AnthropicProvider('sk-ant-test-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate', () => {
    it('should return response from Anthropic API', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Hello from Claude!' }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await provider.generate({
        prompt: 'Say hello',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(result.content).toBe('Hello from Claude!');
      expect(result.usage?.inputTokens).toBe(10);
      expect(result.usage?.outputTokens).toBe(20);
      expect(result.latencyMs).toBeDefined();
    });

    it('should include system prompt when provided', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 15, output_tokens: 5 },
      });

      await provider.generate({
        prompt: 'Hello',
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'You are a helpful assistant.',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are a helpful assistant.',
        })
      );
    });

    it('should handle non-text content blocks', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'image', source: {} }],
        usage: { input_tokens: 10, output_tokens: 0 },
      });

      const result = await provider.generate({
        prompt: 'Describe this',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(result.content).toBe('');
    });

    it('should handle API error gracefully', async () => {
      mockMessagesCreate.mockRejectedValueOnce(new Error('Anthropic API error'));

      const result = await provider.generate({
        prompt: 'Hello',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(result.content).toContain('Error: Anthropic API error');
      expect(result.usage?.inputTokens).toBe(0);
    });

    it('should calculate cost correctly', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 1000, output_tokens: 500 },
      });

      const result = await provider.generate({
        prompt: 'Hello',
        model: 'claude-3-5-sonnet-20241022',
      });

      // Cost = (1000 * 0.003 / 1e6) + (500 * 0.015 / 1e6)
      const expectedCost = (1000 * 0.003 / 1e6) + (500 * 0.015 / 1e6);
      expect(result.usage?.cost).toBeCloseTo(expectedCost, 10);
    });

    it('should calculate totalTokens from input + output', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const result = await provider.generate({
        prompt: 'Hello',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(result.usage?.totalTokens).toBe(150);
    });

    it('should crash when usage data is missing (known bug: usage.input_tokens is not optional)', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Response' }],
        // Missing usage - Anthropic provider expects usage to always be present
      });

      // The provider code does: usage.input_tokens which throws on undefined usage
      const result = await provider.generate({
        prompt: 'Hello',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(result.content).toContain('Error');
    });
  });

  describe('embed', () => {
    it('should return random embedding vector', async () => {
      const result = await provider.embed({ text: 'Hello' });

      expect(result.vector).toBeDefined();
      expect(result.vector).toHaveLength(1536);
    });

    it('should return different vectors for different calls', async () => {
      const result1 = await provider.embed({ text: 'Hello' });
      const result2 = await provider.embed({ text: 'Hello' });

      // Since Anthropic uses random vectors, they should be different
      expect(result1.vector).not.toEqual(result2.vector);
    });
  });
});

describe('createLLMProvider (edge cases)', () => {
  it('should create OpenAI provider with env variable when no key provided', () => {
    const originalEnv = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-env-key';

    const provider = createLLMProvider('openai');

    expect(provider).toBeInstanceOf(OpenAIProvider);

    process.env.OPENAI_API_KEY = originalEnv;
  });

  it('should create Anthropic provider with env variable when no key provided', () => {
    const originalEnv = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';

    const provider = createLLMProvider('anthropic');

    expect(provider).toBeInstanceOf(AnthropicProvider);

    process.env.ANTHROPIC_API_KEY = originalEnv;
  });

  it('should respect DEFAULT_LLM_PROVIDER env variable', () => {
    const originalEnv = process.env.DEFAULT_LLM_PROVIDER;
    process.env.DEFAULT_LLM_PROVIDER = 'openai';

    // Re-import won't work due to module caching, so we just test the factory
    const provider = createLLMProvider(process.env.DEFAULT_LLM_PROVIDER);

    expect(provider).toBeInstanceOf(OpenAIProvider);

    process.env.DEFAULT_LLM_PROVIDER = originalEnv;
  });
});