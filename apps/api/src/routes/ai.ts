import { Hono } from 'hono';
import { createLLMProvider } from '@agentops/ai';
import { db } from '@agentops/db';
import { aiModelConfigs, workflowVersions, workflows, projects } from '@agentops/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUser } from '../lib/auth';
import { z } from 'zod';

export const aiRoutes = new Hono();

// Validation schemas
const generateWorkflowSchema = z.object({
  projectId: z.string().uuid(),
  description: z.string().min(1),
  context: z.object({
    knowledgeBaseIds: z.array(z.string().uuid()).optional(),
  }).optional(),
  modelConfigId: z.string().uuid().optional(),
});

const modifyWorkflowSchema = z.object({
  workflowId: z.string().uuid(),
  workflowVersionId: z.string().uuid(),
  currentDefinition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
  modifications: z.object({
    targetNodes: z.array(z.string()).optional(),
    selectionArea: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }).optional(),
  }),
  instruction: z.string().min(1),
  modelConfigId: z.string().uuid().optional(),
});

const interpretWorkflowSchema = z.object({
  workflowVersionId: z.string().uuid(),
  inputPayload: z.record(z.any()).optional(),
  options: z.object({
    generatePlan: z.boolean().optional().default(true),
    simulateOnly: z.boolean().optional().default(false),
  }),
  modelConfigId: z.string().uuid().optional(),
});

// System prompts for AI
const WORKFLOW_GENERATION_SYSTEM_PROMPT = `You are a workflow design expert. Your task is to generate a workflow definition based on the user's natural language description.

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

Each node has:
- id: unique identifier
- type: node type
- name: display name
- config: configuration object (varies by type)
- position: {x, y} coordinates

Response format (JSON):
{
  "workflow": {
    "name": "Workflow name",
    "description": "Brief description",
    "definition": {
      "nodes": [...],
      "edges": [...]
    }
  },
  "explanation": "Design rationale"
}

Generate ONLY valid JSON, no markdown or additional text.`;

const WORKFLOW_MODIFICATION_SYSTEM_PROMPT = `You are a workflow modification expert. The user wants to modify an existing workflow based on their instruction.

Current workflow definition is provided. Analyze the instruction and modify the workflow accordingly.

Response format (JSON):
{
  "modified": {
    "nodes": [...],
    "edges": [...]
  },
  "changes": [
    {
      "nodeId": "node_id",
      "type": "added|modified|deleted",
      "description": "change description"
    }
  ],
  "explanation": "modification rationale"
}

Generate ONLY valid JSON, no markdown or additional text.`;

// Helper to get LLM provider
async function getLLMProvider(c: any) {
  const authUser = await getAuthUser(c);
  let providerType = 'anthropic';
  let apiKey = process.env.ANTHROPIC_API_KEY;
  let defaultModel = 'claude-3-5-sonnet-20241022';

  if (authUser?.orgId) {
    const config = await db.query.aiModelConfigs.findFirst({
      where: and(
        eq(aiModelConfigs.orgId, authUser.orgId),
        eq(aiModelConfigs.isDefault, true)
      ),
    });

    if (config) {
      providerType = config.provider;
      apiKey = config.apiKey || apiKey;
      defaultModel = config.defaultModel;
    }
  }

  return {
    provider: createLLMProvider(providerType, apiKey),
    model: defaultModel,
  };
}

// Helper to convert nodes to readable format
function nodesToReadable(nodes: any[]): string {
  return nodes.map((node) => {
    const configStr = JSON.stringify(node.config || {}, null, 2);
    return `Node "${node.name}" (${node.type}):\n${configStr}`;
  }).join('\n\n');
}

// Helper to convert edges to readable format
function edgesToReadable(edges: any[], nodes: any[]): string {
  return edges.map((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    return `${sourceNode?.name || edge.source} → ${targetNode?.name || edge.target}${edge.sourceHandle ? ` (${edge.sourceHandle})` : ''}`;
  }).join('\n');
}

// POST /ai/workflows/generate - Generate workflow using AI
aiRoutes.post('/workflows/generate', async (c) => {
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const body = await c.req.json();
  const parsed = generateWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  // Verify project access
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, parsed.data.projectId), eq(projects.organizationId, authUser.orgId!)),
  });

  if (!project) {
    return c.json({ error: { formErrors: ['Project not found'] } }, 404);
  }

  const { provider, model } = await getLLMProvider(c);

  // Build context prompt
  let contextPrompt = '';
  if (parsed.data.context?.knowledgeBaseIds?.length) {
    contextPrompt = `\n\nContext: User wants to use knowledge base for this workflow.`;
  }

  // Generate workflow using AI
  const userPrompt = `
## Task
Generate a workflow based on the following description:

${parsed.data.description}
${contextPrompt}

## Requirements
1. Start with a "start" node
2. End with an "output" node
3. Use appropriate node types based on the task
4. Include error handling where necessary
5. Consider adding review nodes for important decisions

Please generate the workflow definition.
`;

  const result = await provider.generate({
    prompt: userPrompt,
    model,
    systemPrompt: WORKFLOW_GENERATION_SYSTEM_PROMPT,
    temperature: 0.3,
  });

  // Parse the response
  let workflowData;
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      workflowData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    return c.json({
      error: { formErrors: ['Failed to parse AI response'] },
    }, 500);
  }

  return c.json({
    data: {
      workflow: workflowData.workflow,
      explanation: workflowData.explanation || '',
      confidence: 0.8,
    },
  });
});

// POST /ai/workflows/modify - Modify workflow using AI
aiRoutes.post('/workflows/modify', async (c) => {
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const body = await c.req.json();
  const parsed = modifyWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  // Verify workflow access
  const version = await db.query.workflowVersions.findFirst({
    where: eq(workflowVersions.id, parsed.data.workflowVersionId),
    with: {
      workflow: true,
    },
  });

  if (!version) {
    return c.json({ error: { formErrors: ['Workflow not found'] } }, 404);
  }

  // Verify the workflow ID matches
  if (version.workflowId !== parsed.data.workflowId) {
    return c.json({ error: { formErrors: ['Workflow not found'] } }, 404);
  }

  const { provider, model } = await getLLMProvider(c);

  // Build context
  const nodesContext = nodesToReadable(parsed.data.currentDefinition.nodes);
  const edgesContext = edgesToReadable(parsed.data.currentDefinition.edges, parsed.data.currentDefinition.nodes);

  const userPrompt = `
## Current Workflow Structure

Nodes:
${nodesContext}

Edges:
${edgesContext}

## Modification Request
${parsed.data.instruction}

## Target Nodes
${parsed.data.modifications.targetNodes?.length
    ? `The user has selected these nodes: ${parsed.data.modifications.targetNodes.join(', ')}`
    : 'No specific nodes selected - modify the entire workflow as needed.'}

Please modify the workflow according to the instruction.
`;

  const result = await provider.generate({
    prompt: userPrompt,
    model,
    systemPrompt: WORKFLOW_MODIFICATION_SYSTEM_PROMPT,
    temperature: 0.5,
  });

  // Parse the response
  let modifyData;
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      modifyData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    return c.json({
      error: { formErrors: ['Failed to parse AI response'] },
    }, 500);
  }

  return c.json({
    data: {
      modified: modifyData.modified,
      changes: modifyData.changes || [],
      explanation: modifyData.explanation || '',
    },
  });
});

// POST /ai/runs/interpret - Interpret workflow and generate execution plan
aiRoutes.post('/runs/interpret', async (c) => {
  const authUser = await getAuthUser(c);

  if (!authUser) {
    return c.json({ error: { formErrors: ['Unauthorized'] } }, 401);
  }

  const body = await c.req.json();
  const parsed = interpretWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  // Get workflow version
  const version = await db.query.workflowVersions.findFirst({
    where: eq(workflowVersions.id, parsed.data.workflowVersionId),
  });

  if (!version) {
    return c.json({ error: { formErrors: ['Workflow version not found'] } }, 404);
  }

  const definition = version.definition as any;
  const { provider, model } = await getLLMProvider(c);

  // Convert workflow to natural language
  const nodesContext = nodesToReadable(definition.nodes || []);
  const edgesContext = edgesToReadable(definition.edges || [], definition.nodes || []);

  const userPrompt = `
## Workflow Definition

Nodes:
${nodesContext}

Edges:
${edgesContext}

## User Input
${JSON.stringify(parsed.data.inputPayload || {}, null, 2)}

## Task
1. Analyze this workflow to understand its purpose
2. Generate an execution plan that breaks down each step
3. Estimate the complexity and token usage

Response format (JSON):
{
  "executionPlan": {
    "reasoning": "Overall plan explanation",
    "steps": [
      {
        "stepId": "step_1",
        "order": 1,
        "nodeName": "Node name",
        "description": "What this step does",
        "action": "llm|retrieval|webhook|code|output|ai_review",
        "input": {},
        "dependsOn": []
      }
    ],
    "totalEstimatedTokens": 1000
  },
  "nodeExplanations": {
    "node_id": "explanation for this node"
  }
}

Generate ONLY valid JSON, no markdown or additional text.
`;

  const result = await provider.generate({
    prompt: userPrompt,
    model,
    temperature: 0.3,
  });

  // Parse the response
  let interpretData;
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      interpretData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    return c.json({
      error: { formErrors: ['Failed to parse AI response'] },
    }, 500);
  }

  return c.json({
    data: {
      executionPlan: interpretData.executionPlan,
      nodeExplanations: interpretData.nodeExplanations || {},
      runId: parsed.data.options.simulateOnly ? undefined : `pending-${Date.now()}`,
    },
  });
});
