import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { EmbeddingInput, EmbeddingOutput, LLMProvider, ModelGenerateInput, ModelGenerateOutput } from './types';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || 'sk-dummy',
    });
  }

  async generate(input: ModelGenerateInput): Promise<ModelGenerateOutput> {
    const startTime = Date.now();
    
    try {
      const completion = await this.client.chat.completions.create({
        model: input.model || 'gpt-4',
        messages: [
          ...(input.systemPrompt ? [{ role: 'system' as const, content: input.systemPrompt }] : []),
          { role: 'user' as const, content: input.prompt },
        ],
        temperature: input.temperature ?? 0.7,
        max_tokens: input.maxTokens ?? 4096,
      });

      const response = completion.choices[0]?.message?.content || '';
      const usage = completion.usage;

      const inputCostPer1M = 0.03;
      const outputCostPer1M = 0.06;
      const cost = ((usage?.prompt_tokens || 0) * inputCostPer1M / 1e6) +
                   ((usage?.completion_tokens || 0) * outputCostPer1M / 1e6);

      return {
        content: response,
        usage: {
          inputTokens: usage?.prompt_tokens || 0,
          outputTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
          cost,
        },
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        content: `Error: ${error.message}`,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 },
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async embed(input: EmbeddingInput): Promise<EmbeddingOutput> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: input.text,
      });

      return {
        vector: response.data[0]?.embedding || [],
      };
    } catch (error: any) {
      const fallbackVector = Array.from({ length: 1536 }, (_, i) => Math.random() * 2 - 1);
      return { vector: fallbackVector };
    }
  }
}

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || 'sk-ant-dummy',
    });
  }

  async generate(input: ModelGenerateInput): Promise<ModelGenerateOutput> {
    const startTime = Date.now();
    
    try {
      const message = await this.client.messages.create({
        model: input.model || 'claude-3-5-sonnet-20241022',
        max_tokens: input.maxTokens ?? 4096,
        temperature: input.temperature ?? 0.7,
        system: input.systemPrompt,
        messages: [
          { role: 'user', content: input.prompt },
        ],
      });

      const response = message.content[0]?.type === 'text' ? message.content[0].text : '';
      const usage = message.usage;

      const inputCostPer1M = 0.003;
      const outputCostPer1M = 0.015;
      const cost = ((usage.input_tokens || 0) * inputCostPer1M / 1e6) +
                   ((usage.output_tokens || 0) * outputCostPer1M / 1e6);

      return {
        content: response,
        usage: {
          inputTokens: usage.input_tokens || 0,
          outputTokens: usage.output_tokens || 0,
          totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
          cost,
        },
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        content: `Error: ${error.message}`,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 },
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async embed(_input: EmbeddingInput): Promise<EmbeddingOutput> {
    return { vector: Array.from({ length: 1536 }, () => Math.random() * 2 - 1) };
  }
}

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

export function createLLMProvider(type: string, apiKey?: string): LLMProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    default:
      return new MockLLMProvider();
  }
}

export const defaultLLMProvider = createLLMProvider(
  process.env.DEFAULT_LLM_PROVIDER || 'mock'
);
