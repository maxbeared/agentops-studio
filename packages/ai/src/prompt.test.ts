import { describe, it, expect } from 'vitest';
import { renderPrompt } from './prompt';

describe('packages/ai/src/prompt', () => {
  describe('renderPrompt', () => {
    it('should replace single variable in template', () => {
      const template = 'Hello, {{name}}!';
      const variables = { name: 'World' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Hello, World!');
    });

    it('should replace multiple variables in template', () => {
      const template = '{{greeting}}, {{name}}! You have {{count}} messages.';
      const variables = { greeting: 'Hello', name: 'Alice', count: 5 };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Hello, Alice! You have 5 messages.');
    });

    it('should handle missing variables (leave placeholder)', () => {
      const template = 'Hello, {{name}}! Your email is {{email}}.';
      const variables = { name: 'Bob' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Hello, Bob! Your email is {{email}}.');
    });

    it('should replace same variable multiple times', () => {
      const template = '{{name}} said: {{name}} is the best!';
      const variables = { name: 'Charlie' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Charlie said: Charlie is the best!');
    });

    it('should handle empty template', () => {
      const result = renderPrompt('', { name: 'Test' });

      expect(result).toBe('');
    });

    it('should handle empty variables', () => {
      const template = 'Hello, World!';
      const result = renderPrompt(template, {});

      expect(result).toBe('Hello, World!');
    });

    it('should handle template with no variables', () => {
      const template = 'Static text without variables';
      const result = renderPrompt(template, { foo: 'bar' });

      expect(result).toBe('Static text without variables');
    });

    it('should convert non-string values to string', () => {
      const template = 'Count: {{count}}, Active: {{active}}';
      const variables = { count: 42, active: true };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Count: 42, Active: true');
    });

    it('should handle numeric zero', () => {
      const template = 'Value: {{value}}';
      const variables = { value: 0 };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Value: 0');
    });

    it('should handle empty string value', () => {
      const template = 'Name: {{name}}';
      const variables = { name: '' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Name: ');
    });

    it('should handle whitespace in variable names', () => {
      const template = '{{first name}}';
      const variables = { 'first name': 'John' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('John');
    });

    it('should handle special characters in values', () => {
      const template = 'Path: {{path}}';
      const variables = { path: 'C:\\Users\\Test\\file.txt' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Path: C:\\Users\\Test\\file.txt');
    });

    it('should handle newlines in values', () => {
      const template = 'Content:\n{{content}}\nEnd';
      const variables = { content: 'Line 1\nLine 2\nLine 3' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Content:\nLine 1\nLine 2\nLine 3\nEnd');
    });

    it('should handle JSON-like values', () => {
      const template = 'Data: {{data}}';
      const variables = { data: '{"key": "value"}' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Data: {"key": "value"}');
    });

    it('should handle undefined as value', () => {
      const template = 'Value: {{val}}';
      const variables = { val: undefined };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Value: undefined');
    });

    it('should handle null as value', () => {
      const template = 'Value: {{val}}';
      const variables = { val: null };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Value: null');
    });

    it('should handle array values', () => {
      const template = 'Items: {{items}}';
      const variables = { items: ['a', 'b', 'c'] };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Items: a,b,c');
    });

    it('should handle object values', () => {
      const template = 'Data: {{data}}';
      const variables = { data: { key: 'value' } };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Data: [object Object]');
    });

    it('should handle nested template placeholders', () => {
      const template = '{{outer {{inner}}}}';
      const variables = { inner: 'found' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('{{outer found}}');
    });

    it('should handle consecutive variables', () => {
      const template = '{{a}}{{b}}{{c}}';
      const variables = { a: '1', b: '2', c: '3' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('123');
    });

    it('should handle variable at start of template', () => {
      const template = '{{greeting}}, World!';
      const variables = { greeting: 'Hello' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Hello, World!');
    });

    it('should handle variable at end of template', () => {
      const template = 'Hello, {{name}}';
      const variables = { name: 'World' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Hello, World');
    });

    it('should handle entire template as single variable', () => {
      const template = '{{content}}';
      const variables = { content: 'The entire content' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('The entire content');
    });

    it('should handle template with extra whitespace around variables (exact match only)', () => {
      // renderPrompt uses exact match, so {{ name }} is NOT replaced by {{name}}
      const template = 'Hello,   {{ name }}!';
      const variables = { name: 'World' };

      const result = renderPrompt(template, variables);

      expect(result).toBe('Hello,   {{ name }}!');
    });
  });
});