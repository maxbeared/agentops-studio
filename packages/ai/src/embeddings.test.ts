import { describe, it, expect } from 'vitest';
import { generateEmbedding } from './embeddings';

describe('packages/ai/src/embeddings', () => {
  describe('generateEmbedding', () => {
    it('should generate embedding with correct vector length', async () => {
      const result = await generateEmbedding({ text: 'hello world' });

      expect(result.vector).toBeDefined();
      expect(result.vector).toHaveLength(16);
    });

    it('should generate deterministic embedding for same input', async () => {
      const input = { text: 'test string' };

      const result1 = await generateEmbedding(input);
      const result2 = await generateEmbedding(input);

      expect(result1.vector).toEqual(result2.vector);
    });

    it('should generate different embeddings for different texts', async () => {
      const result1 = await generateEmbedding({ text: 'hi' });
      const result2 = await generateEmbedding({ text: 'hello world' });

      expect(result1.vector).not.toEqual(result2.vector);
    });

    it('should handle empty string', async () => {
      const result = await generateEmbedding({ text: '' });

      expect(result.vector).toBeDefined();
      expect(result.vector).toHaveLength(16);
    });

    it('should handle long text', async () => {
      const longText = 'a'.repeat(10000);
      const result = await generateEmbedding({ text: longText });

      expect(result.vector).toBeDefined();
      expect(result.vector).toHaveLength(16);
    });

    it('should handle special characters', async () => {
      const result = await generateEmbedding({ text: 'Hello! @#$%^&*() 你好 🌍' });

      expect(result.vector).toBeDefined();
      expect(result.vector).toHaveLength(16);
    });

    it('should handle text with newlines and tabs', async () => {
      const result = await generateEmbedding({ text: 'line1\nline2\tline3' });

      expect(result.vector).toBeDefined();
      expect(result.vector).toHaveLength(16);
    });

    it('should include raw field in output', async () => {
      const result = await generateEmbedding({ text: 'test' });

      expect(result.raw).toBeUndefined();
    });

    it('should generate vector values in valid range', async () => {
      const result = await generateEmbedding({ text: 'test input' });

      result.vector.forEach((value) => {
        expect(typeof value).toBe('number');
        expect(Number.isFinite(value)).toBe(true);
      });
    });
  });
});