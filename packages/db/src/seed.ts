import { db } from './index';
import { users, organizations, organizationMembers, projects, workflows, workflowVersions, workflowRuns, workflowNodeRuns, knowledgeDocuments, knowledgeChunks, promptTemplates } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const DEMO_USER = {
  email: 'demo@agentops.studio',
  password: 'demo123456',
  name: 'Demo User',
};

const DEMO_ORG = {
  name: 'AgentOps Studio',
  slug: 'agentops-studio',
};

async function seed() {
  console.log('🌱 Starting seed...');

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, DEMO_USER.email),
  });

  if (existingUser) {
    console.log('✅ Demo user already exists, skipping seed');
    console.log(`   User ID: ${existingUser.id}`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);

  const [user] = await db
    .insert(users)
    .values({
      email: DEMO_USER.email,
      passwordHash,
      name: DEMO_USER.name,
    })
    .returning();

  console.log(`✅ Created demo user: ${user.email}`);
  console.log(`   User ID: ${user.id}`);

  const [org] = await db
    .insert(organizations)
    .values({
      name: DEMO_ORG.name,
      slug: DEMO_ORG.slug,
      ownerId: user.id,
    })
    .returning();

  console.log(`✅ Created demo organization: ${org.name}`);
  console.log(`   Org ID: ${org.id}`);

  await db.insert(organizationMembers).values({
    organizationId: org.id,
    userId: user.id,
    role: 'owner',
  });

  console.log('✅ Added user as organization owner');

  // Create demo project
  const [project] = await db.insert(projects).values({
    organizationId: org.id,
    name: 'AI Content Generator',
    description: 'Automated content generation workflow with human review gates',
    createdBy: user.id,
  }).returning();
  console.log(`✅ Created demo project: ${project.name}`);

  // Create demo knowledge document
  const [doc] = await db.insert(knowledgeDocuments).values({
    projectId: project.id,
    title: 'Product Documentation FAQ',
    sourceType: 'text',
    status: 'processed',
    createdBy: user.id,
  }).returning();

  // Create demo chunks
  await db.insert(knowledgeChunks).values([
    {
      documentId: doc.id,
      projectId: project.id,
      chunkIndex: 0,
      content: 'Our product supports REST API integration with OAuth 2.0 authentication. The API endpoint is https://api.example.com/v1/. Rate limits are 1000 requests per minute for standard tier.',
      embedding: JSON.stringify(Array(1536).fill(0).map(() => Math.random() * 2 - 1)),
    },
    {
      documentId: doc.id,
      projectId: project.id,
      chunkIndex: 1,
      content: 'Common troubleshooting steps: 1) Check API key validity 2) Verify network connectivity 3) Ensure proper Content-Type headers 4) Check response codes in documentation.',
      embedding: JSON.stringify(Array(1536).fill(0).map(() => Math.random() * 2 - 1)),
    },
  ]).returning();
  console.log(`✅ Created demo knowledge document with chunks`);

  // Create demo prompt template
  await db.insert(promptTemplates).values({
    projectId: project.id,
    name: 'Product FAQ Answer Generator',
    description: 'Generates FAQ answers based on product documentation',
    template: 'Based on the following context, answer the user question.\n\nContext: {{context}}\n\nQuestion: {{question}}\n\nProvide a clear and concise answer.',
    inputSchema: { question: 'string', context: 'string' },
    createdBy: user.id,
  }).returning();
  console.log(`✅ Created demo prompt template`);

  // Create demo workflow with version
  const [workflow] = await db.insert(workflows).values({
    projectId: project.id,
    name: 'Content Review Pipeline',
    description: 'AI content generation with mandatory human review',
    status: 'published',
    createdBy: user.id,
  }).returning();

  const workflowDefinition = {
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 100, y: 200 }, data: { name: 'Start' } },
      { id: 'llm-1', type: 'llm', position: { x: 300, y: 200 }, data: { name: 'Generate Content', config: { model: 'gpt-4', prompt: 'Generate engaging content based on the topic: {{topic}}' } } },
      { id: 'condition-1', type: 'condition', position: { x: 500, y: 200 }, data: { name: 'Quality Check', config: { condition: 'prev.LLM.content.length > 100' } } },
      { id: 'review-1', type: 'review', position: { x: 700, y: 200 }, data: { name: 'Human Review', config: { assigneeUserId: null } } },
      { id: 'output-1', type: 'output', position: { x: 900, y: 200 }, data: { name: 'Final Output' } },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'llm-1' },
      { id: 'e2', source: 'llm-1', target: 'condition-1' },
      { id: 'e3', source: 'condition-1', target: 'review-1', sourceHandle: 'yes' },
      { id: 'e4', source: 'condition-1', target: 'output-1', sourceHandle: 'no' },
      { id: 'e5', source: 'review-1', target: 'output-1' },
    ],
  };

  const [version] = await db.insert(workflowVersions).values({
    workflowId: workflow.id,
    version: 1,
    definition: workflowDefinition,
    publishedAt: new Date(),
    createdBy: user.id,
  }).returning();

  // Update workflow with latest version
  await db.update(workflows).set({ latestVersionId: version.id }).where(eq(workflows.id, workflow.id));

  // Update workflow status
  await db.update(workflows).set({ status: 'published' }).where(eq(workflows.id, workflow.id));
  console.log(`✅ Created demo workflow: ${workflow.name}`);

  // Create demo runs with various statuses
  const runStatuses = ['success', 'success', 'success', 'pending', 'failed'];
  const runDates = [
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    new Date(), // now
  ];

  for (let i = 0; i < runStatuses.length; i++) {
    const status = runStatuses[i];
    const startedAt = runDates[i];
    const finishedAt = status !== 'pending' ? new Date(startedAt.getTime() + Math.random() * 60000) : null;
    const tokens = Math.floor(Math.random() * 5000) + 500;
    const cost = tokens * 0.00003;

    const [run] = await db.insert(workflowRuns).values({
      workflowVersionId: version.id,
      projectId: project.id,
      triggeredBy: user.id,
      triggerType: 'manual',
      status,
      inputPayload: { topic: `Demo topic ${i + 1}` },
      outputPayload: status === 'success' ? { content: `Generated content for topic ${i + 1}` } : null,
      startedAt,
      finishedAt,
      totalTokens: tokens,
      totalCost: cost.toFixed(6),
    }).returning();

    // Create node runs for each run
    await db.insert(workflowNodeRuns).values([
      {
        workflowRunId: run.id,
        nodeKey: 'start-1',
        nodeType: 'start',
        status: 'success',
        startedAt,
        finishedAt: new Date(startedAt.getTime() + 100),
        durationMs: 100,
      },
      {
        workflowRunId: run.id,
        nodeKey: 'llm-1',
        nodeType: 'llm',
        status: 'success',
        startedAt: new Date(startedAt.getTime() + 100),
        finishedAt: new Date(startedAt.getTime() + 30000),
        durationMs: 30000,
        tokenUsageInput: Math.floor(tokens * 0.3),
        tokenUsageOutput: Math.floor(tokens * 0.7),
        cost: (cost * 0.8).toFixed(6),
      },
      {
        workflowRunId: run.id,
        nodeKey: 'condition-1',
        nodeType: 'condition',
        status: 'success',
        startedAt: new Date(startedAt.getTime() + 30100),
        finishedAt: new Date(startedAt.getTime() + 30150),
        durationMs: 50,
      },
      {
        workflowRunId: run.id,
        nodeKey: status === 'failed' ? 'llm-1' : 'review-1',
        nodeType: status === 'failed' ? 'llm' : 'review',
        status: status === 'failed' ? 'failed' : (status === 'success' ? 'success' : 'pending'),
        startedAt: new Date(startedAt.getTime() + 30150),
        finishedAt: status !== 'pending' ? new Date(startedAt.getTime() + 60000) : null,
        durationMs: status !== 'pending' ? 30000 : null,
        errorMessage: status === 'failed' ? 'Simulated failure for demo' : null,
      },
    ]).returning();
  }
  console.log(`✅ Created ${runStatuses.length} demo workflow runs`);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Demo credentials:');
  console.log(`   Email: ${DEMO_USER.email}`);
  console.log(`   Password: ${DEMO_USER.password}`);
}

seed().catch(console.error);