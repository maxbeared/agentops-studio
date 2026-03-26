export type ModelGenerateInput = {
  prompt: string;
  model: string;
  temperature?: number;
  systemPrompt?: string;
  maxTokens?: number;
};

export type ModelGenerateOutput = {
  content: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    cost?: number;
  };
  latencyMs?: number;
  raw?: unknown;
};

export type EmbeddingInput = {
  text: string;
  model?: string;
};

export type EmbeddingOutput = {
  vector: number[];
  raw?: unknown;
};

export interface LLMProvider {
  generate(input: ModelGenerateInput): Promise<ModelGenerateOutput>;
  embed?(input: EmbeddingInput): Promise<EmbeddingOutput>;
}
