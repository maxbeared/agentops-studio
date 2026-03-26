import type { EmbeddingInput, EmbeddingOutput, LLMProvider, ModelGenerateInput, ModelGenerateOutput } from './types';

export class MockLLMProvider implements LLMProvider {
  async generate(input: ModelGenerateInput): Promise<ModelGenerateOutput> {
    return {
      content: `Mock response for model ${input.model}: ${input.prompt.slice(0, 200)}`,
      usage: {
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.0012,
      },
    };
  }

  async embed(input: EmbeddingInput): Promise<EmbeddingOutput> {
    const vector = Array.from({ length: 16 }, (_, i) => (input.text.length + i) / 100);
    return { vector };
  }
}

export const defaultLLMProvider = new MockLLMProvider();
