import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockLLMProvider, OpenAIProvider, AnthropicProvider, createLLMProvider } from './providers';
import type { ModelGenerateInput, EmbeddingInput } from './types';

describe('packages/ai/src/providers', () => {
  describe('MockLLMProvider', () => {
    let provider: MockLLMProvider;

    beforeEach(() => {
      provider = new MockLLMProvider();
    });

    it('should generate mock response with default usage', async () => {
      const input: ModelGenerateInput = {
        prompt: 'Hello world',
        model: 'test-model',
      };

      const result = await provider.generate(input);

      expect(result.content).toContain('Mock response');
      expect(result.content).toContain('test-model');
      expect(result.usage).toBeDefined();
      expect(result.usage?.inputTokens).toBe(100);
      expect(result.usage?.outputTokens).toBe(200);
      expect(result.usage?.totalTokens).toBe(300);
      expect(result.usage?.cost).toBe(0.0012);
    });

    it('should include prompt in response content', async () => {
      const input: ModelGenerateInput = {
        prompt: 'What is the meaning of life?',
        model: 'test-model',
      };

      const result = await provider.generate(input);

      expect(result.content).toContain(input.prompt);
    });

    it('should generate consistent embeddings', async () => {
      const input: EmbeddingInput = { text: 'test text' };

      const result1 = await provider.embed(input);
      const result2 = await provider.embed(input);

      expect(result1.vector).toBeDefined();
      expect(result1.vector).toHaveLength(16);
      expect(result1.vector).toEqual(result2.vector);
    });

    it('should generate different embeddings for different texts', async () => {
      const input1: EmbeddingInput = { text: 'hi' };
      const input2: EmbeddingInput = { text: 'hello world' };

      const result1 = await provider.embed(input1);
      const result2 = await provider.embed(input2);

      expect(result1.vector).not.toEqual(result2.vector);
    });

    it('should handle long text input', async () => {
      const longText = 'a'.repeat(10000);
      const input: EmbeddingInput = { text: longText };

      const result = await provider.embed(input);

      expect(result.vector).toBeDefined();
      expect(result.vector).toHaveLength(16);
    });
  });

  describe('createLLMProvider', () => {
    it('should create MockLLMProvider when type is "mock"', () => {
      const provider = createLLMProvider('mock');
      expect(provider).toBeInstanceOf(MockLLMProvider);
    });

    it('should create OpenAIProvider when type is "openai"', () => {
      const provider = createLLMProvider('openai', 'sk-test-key');
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should create AnthropicProvider when type is "anthropic"', () => {
      const provider = createLLMProvider('anthropic', 'sk-ant-test-key');
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should create MockLLMProvider for unknown type', () => {
      const provider = createLLMProvider('unknown' as any);
      expect(provider).toBeInstanceOf(MockLLMProvider);
    });

    it('should default to MockLLMProvider when no type specified', () => {
      const provider = createLLMProvider('');
      expect(provider).toBeInstanceOf(MockLLMProvider);
    });
  });

  describe('OpenAIProvider', () => {
    it('should be instantiable with API key', () => {
      const provider = new OpenAIProvider('sk-test-key');
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should use environment variable when no API key provided', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'sk-env-key';

      const provider = new OpenAIProvider();

      expect(provider).toBeInstanceOf(OpenAIProvider);
      process.env.OPENAI_API_KEY = originalEnv;
    });
  });

  describe('AnthropicProvider', () => {
    it('should be instantiable with API key', () => {
      const provider = new AnthropicProvider('sk-ant-test-key');
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should use environment variable when no API key provided', () => {
      const originalEnv = process.env.ANTHROPIC_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';

      const provider = new AnthropicProvider();

      expect(provider).toBeInstanceOf(AnthropicProvider);
      process.env.ANTHROPIC_API_KEY = originalEnv;
    });
  });

  describe('Provider interface compliance', () => {
    it('MockLLMProvider should have generate method', () => {
      const provider = new MockLLMProvider();
      expect(typeof provider.generate).toBe('function');
    });

    it('MockLLMProvider should have embed method', () => {
      const provider = new MockLLMProvider();
      expect(typeof provider.embed).toBe('function');
    });

    it('OpenAIProvider should have generate method', () => {
      const provider = new OpenAIProvider('sk-test');
      expect(typeof provider.generate).toBe('function');
    });

    it('OpenAIProvider should have embed method', () => {
      const provider = new OpenAIProvider('sk-test');
      expect(typeof provider.embed).toBe('function');
    });

    it('AnthropicProvider should have generate method', () => {
      const provider = new AnthropicProvider('sk-ant-test');
      expect(typeof provider.generate).toBe('function');
    });

    it('AnthropicProvider should have embed method', () => {
      const provider = new AnthropicProvider('sk-ant-test');
      expect(typeof provider.embed).toBe('function');
    });
  });

  describe('Error handling', () => {
    it('MockLLMProvider should not throw on generate', async () => {
      const provider = new MockLLMProvider();
      await expect(
        provider.generate({ prompt: 'test', model: 'mock' })
      ).resolves.toBeDefined();
    });

    it('MockLLMProvider should not throw on embed', async () => {
      const provider = new MockLLMProvider();
      await expect(
        provider.embed({ text: 'test' })
      ).resolves.toBeDefined();
    });
  });
});
