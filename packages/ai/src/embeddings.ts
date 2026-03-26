import type { EmbeddingInput, EmbeddingOutput } from './types';

export async function generateEmbedding(input: EmbeddingInput): Promise<EmbeddingOutput> {
  const vector = Array.from({ length: 16 }, (_, i) => (input.text.length + i) / 100);
  return { vector };
}
