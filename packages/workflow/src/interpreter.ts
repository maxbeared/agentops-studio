import type { WorkflowDefinition, ExecutionPlan, ExecutionStep } from '@agentops/shared/types';
import { createLLMProvider } from '@agentops/ai';

export type InterpretationResult = {
  naturalLanguageDescription: string;
  prompt: string;
  executionPlan: ExecutionPlan;
};

const WORKFLOW_INTERPRET_SYSTEM_PROMPT = `You are a workflow planning expert. Your task is to analyze workflows and create execution plans.

Available node types:
- start: Start node (required, only one)
- llm: AI model call (prompt, model, temperature)
- retrieval: Knowledge base retrieval (query, topK)
- condition: Conditional branch (condition expression)
- review: Human/AI review (reviewMode: manual/ai)
- webhook: HTTP webhook call (url, method)
- output: Output result
- input: Input definition (inputSchema)
- text: Text processing (operation: trim/upper/lower/split/replace)
- loop: Loop iteration (items, maxIterations)
- delay: Delay/wait (duration, unit)
- transform: Data transformation (template)
- code: JavaScript code execution
- merge: Merge multiple branches (strategy: all/first/last)
- errorHandler: Error handling

Analysis Guidelines:
1. Understand the overall goal of the workflow
2. Identify the sequence of steps needed to complete it
3. Note dependencies between steps
4. Identify which steps need AI/LLM calls, knowledge retrieval, or human input
5. Estimate complexity and token usage

Response format (JSON):
{
  "executionPlan": {
    "reasoning": "Overall explanation of the workflow and execution approach",
    "steps": [
      {
        "stepId": "step_1",
        "order": 1,
        "nodeName": "Name of the node",
        "description": "What this step does",
        "action": "llm|retrieval|webhook|code|output|ai_review",
        "input": {},
        "dependsOn": []
      }
    ]
  }
}`;

export class WorkflowInterpreter {
  private llmProvider: ReturnType<typeof createLLMProvider>;
  private model: string;

  constructor(provider: string = 'anthropic', apiKey?: string, model?: string) {
    this.llmProvider = createLLMProvider(provider, apiKey);
    this.model = model || 'claude-3-5-sonnet-20241022';
  }

  async interpret(
    definition: WorkflowDefinition,
    input: Record<string, any>
  ): Promise<InterpretationResult> {
    const nlDescription = this.toNaturalLanguage(definition);
    const prompt = this.buildInterpretationPrompt(nlDescription, input);

    const response = await this.llmProvider.generate({
      prompt,
      model: this.model,
      systemPrompt: WORKFLOW_INTERPRET_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    return this.parseInterpretationResponse(response.content, definition);
  }

  private toNaturalLanguage(definition: WorkflowDefinition): string {
    const nodes = definition.nodes || [];
    const edges = definition.edges || [];

    const nodeDescriptions = nodes.map((node) => {
      const configStr = JSON.stringify(node.config || {}, null, 2);
      return `Node "${node.name}" (${node.type}):\n${configStr}`;
    }).join('\n\n');

    const edgeDescriptions = edges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      return `${sourceNode?.name || edge.source} → ${targetNode?.name || edge.target}${edge.sourceHandle ? ` (${edge.sourceHandle})` : ''}`;
    }).join('\n');

    return `## Workflow Structure

### Nodes:
${nodeDescriptions || 'No nodes defined'}

### Connections:
${edgeDescriptions || 'No connections defined'}`;
  }

  private buildInterpretationPrompt(
    workflowDescription: string,
    input: Record<string, any>
  ): string {
    return `
${workflowDescription}

## User Input
${JSON.stringify(input || {}, null, 2)}

## Task
Analyze this workflow and create a structured execution plan.
`;
  }

  private parseInterpretationResponse(
    content: string,
    definition: WorkflowDefinition
  ): InterpretationResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.createFallbackResult(content);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        naturalLanguageDescription: parsed.executionPlan?.reasoning || 'Workflow analysis',
        prompt: content,
        executionPlan: {
          reasoning: parsed.executionPlan?.reasoning || '',
          steps: (parsed.executionPlan?.steps || []).map((step: any, index: number) => ({
            stepId: step.stepId || `step_${index + 1}`,
            order: step.order || index + 1,
            nodeId: step.nodeId,
            nodeName: step.nodeName || 'Unknown',
            description: step.description || '',
            action: step.action || 'llm',
            input: step.input || {},
            dependsOn: step.dependsOn || [],
          })),
        },
      };
    } catch {
      return this.createFallbackResult(content);
    }
  }

  private createFallbackResult(content: string): InterpretationResult {
    return {
      naturalLanguageDescription: content.slice(0, 500),
      prompt: content,
      executionPlan: {
        reasoning: 'Could not parse structured plan, using raw response',
        steps: [],
      },
    };
  }
}

export default WorkflowInterpreter;
