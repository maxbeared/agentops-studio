import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowInterpreter } from './interpreter';
import { MockLLMProvider } from '@agentops/ai';
import type { WorkflowDefinition } from '@agentops/shared/types';

describe('packages/workflow/src/interpreter', () => {
  let interpreter: WorkflowInterpreter;

  beforeEach(() => {
    // Create interpreter with mock provider
    interpreter = new WorkflowInterpreter('mock');
  });

  describe('constructor', () => {
    it('should create interpreter with default provider', () => {
      const interp = new WorkflowInterpreter();
      expect(interp).toBeDefined();
    });

    it('should create interpreter with anthropic provider', () => {
      const interp = new WorkflowInterpreter('anthropic', 'sk-ant-key');
      expect(interp).toBeDefined();
    });

    it('should create interpreter with custom model', () => {
      const interp = new WorkflowInterpreter('mock', undefined, 'custom-model');
      expect(interp).toBeDefined();
    });
  });

  describe('toNaturalLanguage', () => {
    it('should convert empty workflow to natural language', () => {
      const definition: WorkflowDefinition = {
        nodes: [],
        edges: [],
      };

      // Access private method via any for testing
      const nl = (interpreter as any).toNaturalLanguage(definition);

      expect(nl).toContain('## Workflow Structure');
      expect(nl).toContain('### Nodes:');
      expect(nl).toContain('No nodes defined');
      expect(nl).toContain('### Connections:');
      expect(nl).toContain('No connections defined');
    });

    it('should convert workflow with nodes to natural language', () => {
      const definition: WorkflowDefinition = {
        nodes: [
          { id: '1', type: 'start', name: 'Start Node', config: {}, position: { x: 0, y: 0 } },
          { id: '2', type: 'llm', name: 'AI Call', config: { model: 'gpt-4' }, position: { x: 100, y: 0 } },
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' },
        ],
      };

      const nl = (interpreter as any).toNaturalLanguage(definition);

      expect(nl).toContain('Node "Start Node" (start)');
      expect(nl).toContain('Node "AI Call" (llm)');
      expect(nl).toContain('Start Node → AI Call');
    });

    it('should include node config in description', () => {
      const definition: WorkflowDefinition = {
        nodes: [
          {
            id: '1',
            type: 'llm',
            name: 'AI Assistant',
            config: { model: 'gpt-4', temperature: 0.7 },
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
      };

      const nl = (interpreter as any).toNaturalLanguage(definition);

      expect(nl).toContain('AI Assistant');
      expect(nl).toContain('gpt-4');
      expect(nl).toContain('0.7');
    });

    it('should handle edges with source handles', () => {
      const definition: WorkflowDefinition = {
        nodes: [
          { id: '1', type: 'condition', name: 'Check', config: {}, position: { x: 0, y: 0 } },
          { id: '2', type: 'llm', name: 'True Branch', config: {}, position: { x: 100, y: 0 } },
          { id: '3', type: 'output', name: 'False Branch', config: {}, position: { x: 100, y: 100 } },
        ],
        edges: [
          { id: 'e1', source: '1', target: '2', sourceHandle: 'true' },
          { id: 'e2', source: '1', target: '3', sourceHandle: 'false' },
        ],
      };

      const nl = (interpreter as any).toNaturalLanguage(definition);

      expect(nl).toContain('Check → True Branch (true)');
      expect(nl).toContain('Check → False Branch (false)');
    });
  });

  describe('interpret', () => {
    it('should return interpretation result for empty workflow', async () => {
      const definition: WorkflowDefinition = {
        nodes: [],
        edges: [],
      };

      const result = await interpreter.interpret(definition, {});

      expect(result).toBeDefined();
      expect(result.naturalLanguageDescription).toBeDefined();
      expect(result.prompt).toBeDefined();
      expect(result.executionPlan).toBeDefined();
      expect(result.executionPlan.steps).toBeDefined();
      expect(Array.isArray(result.executionPlan.steps)).toBe(true);
    });

    it('should include user input in the interpretation', async () => {
      const definition: WorkflowDefinition = {
        nodes: [{ id: '1', type: 'start', name: 'Start', config: {}, position: { x: 0, y: 0 } }],
        edges: [],
      };

      const userInput = { query: 'What is AI?', topK: 5 };
      const result = await interpreter.interpret(definition, userInput);

      expect(result.prompt).toContain('What is AI?');
      expect(result.prompt).toContain('5');
    });

    it('should create execution plan with reasoning', async () => {
      const definition: WorkflowDefinition = {
        nodes: [
          { id: '1', type: 'start', name: 'Start', config: {}, position: { x: 0, y: 0 } },
          { id: '2', type: 'llm', name: 'AI', config: {}, position: { x: 100, y: 0 } },
          { id: '3', type: 'output', name: 'Output', config: {}, position: { x: 200, y: 0 } },
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' },
          { id: 'e2', source: '2', target: '3' },
        ],
      };

      const result = await interpreter.interpret(definition, {});

      expect(result.executionPlan).toBeDefined();
      expect(result.executionPlan.reasoning).toBeDefined();
      expect(typeof result.executionPlan.reasoning).toBe('string');
    });

    it('should parse JSON from mock response', async () => {
      const definition: WorkflowDefinition = {
        nodes: [
          { id: '1', type: 'start', name: 'Start', config: {}, position: { x: 0, y: 0 } },
        ],
        edges: [],
      };

      const result = await interpreter.interpret(definition, {});

      // Mock response contains JSON with executionPlan
      expect(result.executionPlan).toBeDefined();
    });
  });

  describe('parseInterpretationResponse', () => {
    it('should parse valid JSON response', () => {
      const definition: WorkflowDefinition = { nodes: [], edges: [] };
      const content = JSON.stringify({
        executionPlan: {
          reasoning: 'Test reasoning',
          steps: [
            {
              stepId: 'step_1',
              order: 1,
              nodeName: 'Test Node',
              description: 'Test description',
              action: 'llm',
              input: { prompt: 'test' },
              dependsOn: [],
            },
          ],
        },
      });

      const result = (interpreter as any).parseInterpretationResponse(content, definition);

      expect(result.executionPlan.reasoning).toBe('Test reasoning');
      expect(result.executionPlan.steps).toHaveLength(1);
      expect(result.executionPlan.steps[0].nodeName).toBe('Test Node');
    });

    it('should handle JSON wrapped in markdown code blocks', () => {
      const definition: WorkflowDefinition = { nodes: [], edges: [] };
      const content = `
Here's the execution plan:

\`\`\`json
{
  "executionPlan": {
    "reasoning": "Test reasoning",
    "steps": [
      {
        "stepId": "step_1",
        "order": 1,
        "nodeName": "Test",
        "description": "Test",
        "action": "llm",
        "input": {},
        "dependsOn": []
      }
    ]
  }
}
\`\`\`
`;

      const result = (interpreter as any).parseInterpretationResponse(content, definition);

      expect(result.executionPlan.reasoning).toBe('Test reasoning');
      expect(result.executionPlan.steps).toHaveLength(1);
    });

    it('should fallback when JSON not found', () => {
      const definition: WorkflowDefinition = { nodes: [], edges: [] };
      const content = 'This is not JSON at all';

      const result = (interpreter as any).parseInterpretationResponse(content, definition);

      expect(result.executionPlan).toBeDefined();
      expect(result.executionPlan.reasoning).toBe('Could not parse structured plan, using raw response');
    });

    it('should fallback on invalid JSON', () => {
      const definition: WorkflowDefinition = { nodes: [], edges: [] };
      const content = '{ invalid json }';

      const result = (interpreter as any).parseInterpretationResponse(content, definition);

      expect(result.executionPlan).toBeDefined();
    });
  });

  describe('buildInterpretationPrompt', () => {
    it('should include workflow description in prompt', () => {
      const workflowDesc = '## Workflow Structure\n### Nodes:\nTest Node';
      const input = { query: 'test' };

      const prompt = (interpreter as any).buildInterpretationPrompt(workflowDesc, input);

      expect(prompt).toContain(workflowDesc);
      expect(prompt).toContain('test');
    });

    it('should handle empty input', () => {
      const workflowDesc = 'Test workflow';
      const input = {};

      const prompt = (interpreter as any).buildInterpretationPrompt(workflowDesc, input);

      expect(prompt).toContain('{}');
    });
  });
});
