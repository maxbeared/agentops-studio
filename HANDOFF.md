# AgentOps Studio 项目交接文档

## 1. 项目目标

**项目名**：AgentOps Studio
**定位**：一个面向团队的 AI 自动化运营中台，用于展示 AI 应用工程师所需的复杂全栈能力。
**核心价值**：证明候选人能够利用 AI 辅助完成一个具备真实业务复杂度的全栈系统，而不是简单的聊天机器人 demo。

### 求职展示重点
- AI 集成能力：RAG、Prompt、模型抽象、多 Agent / Workflow
- 全栈能力：React/Next.js、Bun/Hono、PostgreSQL、Redis、消息队列
- 系统设计能力：工作流引擎、异步任务、状态流转、执行追踪
- 工程化能力：Monorepo、类型共享、Docker、本地基础设施、可扩展架构

---

## 2. 技术栈

### 前端
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- React Flow (@xyflow/react) - Workflow Builder
- Zustand - 状态管理
- Recharts - 图表

### 后端
- Bun + Hono + TypeScript

### 数据与基础设施
- PostgreSQL + Drizzle ORM
- Redis + BullMQ
- MinIO（S3 兼容）
- Docker Compose

### AI 层
- OpenAI Provider (gpt-4, gpt-4-turbo, gpt-3.5-turbo)
- Anthropic Provider (claude-3-5-sonnet)
- LLM Provider 抽象接口
- Prompt 模板渲染
- Embedding 占位实现

---

## 3. 项目结构

```txt
agentops-studio/
├── apps/
│   ├── web/          # Next.js 前端 (localhost:3000)
│   ├── api/          # Bun + Hono API (localhost:3001)
│   └── worker/       # BullMQ Worker
├── packages/
│   ├── shared/       # 共享 types 和 zod schema
│   ├── db/           # Drizzle schema / db client
│   ├── ai/           # AI provider (OpenAI, Anthropic, Mock)
│   └── workflow/     # Workflow engine / executors
├── docker-compose.yml
└── package.json
```

---

## 4. 核心文件清单

### API 路由 (`apps/api/src/routes/`)
| 文件 | 功能 |
|------|------|
| `auth.ts` | JWT 注册/登录/用户信息 |
| `projects.ts` | 项目 CRUD |
| `knowledge.ts` | 知识库文档 + MinIO 上传 |
| `workflows.ts` | 工作流 CRUD + 发布版本 |
| `runs.ts` | 执行记录 + BullMQ 队列 |
| `reviews.ts` | 审核任务 + approve/reject |
| `prompts.ts` | Prompt 模板 CRUD |
| `dashboard.ts` | 统计数据聚合 |

### API 库 (`apps/api/src/lib/`)
| 文件 | 功能 |
|------|------|
| `auth.ts` | JWT 用户认证解析（getAuthUser） |
| `jwt.ts` | JWT 签名/验证 |
| `password.ts` | bcryptjs 密码哈希 |
| `minio.ts` | MinIO 客户端封装 |
| `websocket.ts` | WebSocket 服务端 + 广播函数 |

### WebSocket (`apps/api/src/`)
| 文件 | 功能 |
|------|------|
| `websocket-server.ts` | 独立 WebSocket 服务 (localhost:3002) |

### 前端页面 (`apps/web/app/`)
| 路径 | 功能 |
|------|------|
| `/` | Dashboard 首页 |
| `/projects` | 项目列表 |
| `/workflows` | 工作流列表 |
| `/workflows/[id]` | Workflow Builder 可视化编辑器 |
| `/runs` | 执行记录列表 |
| `/runs/[id]` | Run 详情 + 自动轮询 |
| `/knowledge` | 知识库 + 文件上传 |
| `/prompts` | Prompt 模板管理 |
| `/reviews` | 审核任务列表 + approve/reject |
| `/auth/login` | 登录页 |
| `/auth/register` | 注册页 |

### 前端组件 (`apps/web/components/`)
| 文件 | 功能 |
|------|------|
| `Navbar.tsx` | 全局导航栏（带用户状态） |
| `auth-check.tsx` | 路由守卫（未登录重定向） |
| `workflow/editor-store.ts` | Zustand 工作流编辑器状态 |
| `workflow/nodes.tsx` | React Flow 自定义节点 |
| `workflow/node-config-panel.tsx` | 节点配置面板 |
| `workflow/toolbar.tsx` | 工具栏 |
| `workflow/workflow-editor.tsx` | 主编辑器组件 |

### 上下文 (`apps/web/contexts/`)
| 文件 | 功能 |
|------|------|
| `auth-context.tsx` | AuthProvider 用户状态管理 |

---

## 5. 数据模型（17 张表）

- `users` - 用户
- `organizations` - 组织
- `organization_members` - 组织成员
- `projects` - 项目
- `knowledge_documents` - 知识库文档
- `knowledge_chunks` - 知识块（embedding 占位 text）
- `prompt_templates` - Prompt 模板
- `workflows` - 工作流定义
- `workflow_versions` - 工作流版本
- `workflow_nodes` - 工作流节点
- `workflow_edges` - 工作流边
- `workflow_runs` - 工作流运行记录
- `workflow_node_runs` - 节点执行记录
- `review_tasks` - 审核任务
- `delivery_jobs` - 投递任务
- `model_providers` - 模型提供商配置
- `audit_logs` - 审计日志

---

## 6. API 路由清单

### 认证 `POST /auth/`
| 端点 | 功能 |
|------|------|
| `/register` | 注册 + 创建组织 + 返回 JWT |
| `/login` | 登录验证 + 返回 JWT |
| `/me` | 获取当前用户信息 |

### 项目 `GET|POST /projects/`
| 端点 | 功能 |
|------|------|
| `GET /` | 列表（需 JWT） |
| `POST /` | 创建（需 JWT） |
| `GET /:id` | 详情 |
| `DELETE /:id` | 删除 |

### 知识库 `GET|POST /knowledge/`
| 端点 | 功能 |
|------|------|
| `GET /` | 列表 |
| `POST /` | 创建文本/URL 文档（需 JWT） |
| `POST /upload` | 文件上传到 MinIO（需 JWT） |
| `GET /:id` | 详情 + 签名 URL |
| `POST /:id/process` | 处理文档生成 chunks |

### 工作流 `GET|POST /workflows/`
| 端点 | 功能 |
|------|------|
| `GET /` | 列表 |
| `POST /` | 创建（需 JWT） |
| `GET /:id` | 详情 + 版本定义 |
| `POST /:id/publish` | 发布新版本（需 JWT） |

### 执行记录 `GET|POST /runs/`
| 端点 | 功能 |
|------|------|
| `GET /` | 列表 |
| `POST /` | 创建 + 入 BullMQ 队列（需 JWT） |
| `GET /:id` | 详情 |
| `GET /:id/nodes` | 节点执行结果 |

### 审核任务 `GET|POST /reviews/`
| 端点 | 功能 |
|------|------|
| `GET /` | 列表 |
| `GET /:id` | 详情 |
| `POST /:id/approve` | 批准 + 继续执行 |
| `POST /:id/reject` | 拒绝 + 标记失败 |

### Prompt 模板 `GET|POST /prompts/`
| 端点 | 功能 |
|------|------|
| `GET /` | 列表 |
| `POST /` | 创建（需 JWT） |
| `GET /:id` | 详情 |
| `PUT /:id` | 更新 |
| `DELETE /:id` | 删除 |

### 面板 `GET /dashboard/`
| 端点 | 功能 |
|------|------|
| `GET /stats` | 聚合统计数据 |

---

## 7. Workflow 引擎

### 节点类型 (`packages/workflow/src/executors.ts`)

| 节点类型 | Executor | 功能 |
|----------|----------|------|
| `start` | StartNodeExecutor | 初始化输入 |
| `llm` | LLMNodeExecutor | AI 模型调用（自动选择 OpenAI/Anthropic） |
| `retrieval` | RetrievalNodeExecutor | 知识检索 |
| `condition` | ConditionNodeExecutor | 条件分支（支持动态条件） |
| `review` | ReviewNodeExecutor | 人工审核（返回 waiting_review） |
| `webhook` | WebhookNodeExecutor | HTTP 请求 |
| `output` | OutputNodeExecutor | 输出结果 |

### 执行流程
1. 从 `start` 节点开始递归执行
2. 根据边连接到下一个节点
3. `review` 节点暂停等待人工审核
4. 节点输出存入 `ctx.outputs`（独立于 `ctx.state`）
5. 通过 NodeExecutionListener 回调记录每个节点执行到数据库
6. 最终结果从 `ctx.outputs` 返回，避免循环引用

### 审核后继续执行
当审核被批准后，工作流可以从下一个节点继续执行：
1. Worker 创建 `workflow-continue` 队列任务
2. API 审核 approve 端点触发继续执行
3. WorkflowEngine.executeFrom() 从下一个节点恢复执行

### BullMQ 队列
| 队列名 | 功能 |
|--------|------|
| `workflow-execution` | 工作流初始执行 |
| `workflow-continue` | 审核批准后继续执行 |
| `document-processing` | 文档处理（待实现） |

### ExecutionContext 结构
```typescript
type ExecutionContext = {
  input: Record<string, any>;      // 原始输入
  state: Record<string, any>;     // 保留用于动态条件计算
  outputs: Record<string, any>;    // 节点执行输出（解决循环引用）
  prevOutputs: Record<string, any>; // 前序节点输出（用于上下文注入）
};
```

### RetrievalService 接口
```typescript
type RetrievalService = {
  retrieve(projectId: string, query: string, topK: number): Promise<Array<{
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>>;
};
```

### AI Provider 自动选择
```typescript
if (model.startsWith('claude-')) return AnthropicProvider;
if (model.startsWith('gpt-') || model.startsWith('o1')) return OpenAIProvider;
return MockLLMProvider;
```

### ConditionNodeExecutor 条件评估
```typescript
// 支持 ctx.input, ctx.state, ctx.prev（前序输出）, ctx.outputs
const evalContext = { ...ctx.state, input: ctx.input, prev: ctx.prevOutputs, outputs: ctx.outputs };
result = this.evaluateCondition(condition, evalContext);
// 支持表达式: input.score > 0.5, prev.LLM.content.includes('error'), etc.
```

**安全表达式解析器**：不使用 `new Function()`，实现安全的表达式解析：
- 支持操作符：`===`, `!==`, `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, `||`, `!`
- 支持三元运算符：`condition ? trueVal : falseVal`
- 支持属性访问：`input.foo`, `prev.bar`, `outputs.baz`, `state.qux`

---

## 8. WebSocket 实时推送

### 服务
- 独立服务 `websocket-server.ts` 监听 `localhost:3002`
- 使用 `ws` 库
- Worker 通过 WebSocket 客户端向服务器广播状态更新

### Worker 广播函数
```typescript
// apps/worker/src/index.ts
function broadcastRunUpdate(runId: string, update: Record<string, unknown>) {
  const ws = getWebSocketClient();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'run_update',
      runId,
      ...update,
    }));
  }
}
```

### 消息类型
```typescript
// 客户端订阅
{ type: 'subscribe', runId: string }

// 服务端推送
{ type: 'run_update', runId: string, ...update }
{ type: 'review_update', taskId: string, ...update }
```

### 前端 Run 详情页轮询
- `running` / `pending` / `waiting_review` 状态时自动轮询（3秒间隔）
- 完成后自动停止轮询

---

## 9. 环境变量

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/agentops
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret
API_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
WS_PORT=3002
WS_URL=ws://localhost:3002
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123
S3_BUCKET=agentops
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 10. 启动命令

```bash
# 1. 启动 Docker 基础设施
docker-compose up -d

# 2. 数据库迁移
pnpm db:generate
pnpm db:migrate

# 3. 数据库种子
pnpm db:seed

# 4. 启动 API (localhost:3001)
cd apps/api && bun run src/index.ts

# 5. 启动 WebSocket (localhost:3002)
cd apps/api && bun run src/websocket-server.ts

# 6. 启动 Worker
cd apps/worker && bun run src/index.ts

# 7. 启动 Web (localhost:3000)
cd apps/web && pnpm dev
```

### Demo 账号
```
Email: demo@agentops.studio
Password: demo123456
```

---

## 11. 已完成功能清单

### ✅ 核心功能
- [x] 数据库 schema（17 张表）+ 迁移 + 种子
- [x] JWT Auth（注册/登录/用户状态）
- [x] 项目/工作流/执行记录 CRUD（全部使用 JWT 认证）
- [x] Workflow Builder（React Flow 可视化编辑器）
- [x] 知识库 + MinIO 文件上传
- [x] 审核任务 + approve/reject + 继续执行
- [x] Prompt 模板管理
- [x] BullMQ 异步任务队列
- [x] 真实 AI Provider（OpenAI + Anthropic）
- [x] WebSocket 实时推送（API 服务端）
- [x] Worker WebSocket 广播（Worker → API WS Server）
- [x] Run 详情页自动轮询
- [x] Worker 节点执行记录到数据库
- [x] Workflow 引擎支持节点执行监听器回调
- [x] 前端路由守卫组件（auth-check）
- [x] Workflow 引擎输出与状态分离（解决循环引用）
- [x] LLM 节点前序上下文注入（prevOutputs）
- [x] 真实向量检索服务（OpenAI embedding + 余弦相似度）
- [x] Knowledge processing 生成真实 embedding
- [x] Worker review 节点自动创建审核任务记录
- [x] ConditionNodeExecutor 支持 prevOutputs 上下文
- [x] **工作流审核批准后自动继续执行**
- [x] **ConditionNodeExecutor 安全表达式解析器（移除 new Function）**
- [x] **前端按钮添加 type="button" 属性**
- [x] **Condition 节点配置面板（支持表达式编辑）**
- [x] **Dashboard 页面改为 Client Component（避免 hydration 问题）**

### ✅ 最近修复
- [x] **构建错误修复** - projects/runs 页面从 Server Component 改为 Client Component
- [x] **useState 误用修复** - workflows 页面正确使用 useEffect 进行数据获取
- [x] **代码质量** - nodes.tsx 添加 React 导入、移除未使用导入
- [x] **docker-compose** - 移除过时 version 属性

### ⚠️ 已知限制
- `knowledge_chunks.embedding` 存储为 JSON 序列化的 float array（text 类型），非 pgvector
- API 生产构建需要处理 MinIO 可选依赖（开发模式不受影响）
- 部分 accessibility 属性待完善（aria-label 等）

---

## 12. 代码关键点

### JWT 认证流程
```typescript
// apps/api/src/lib/auth.ts
export async function getAuthUser(c: Context): Promise<AuthUser | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token) as AuthPayload;
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });
    if (!user) return null;
    return { userId: user.id, email: user.email, orgId: payload.orgId };
  } catch {
    return null;
  }
}
```

### Worker 节点执行记录 + WebSocket 广播 + Review 任务创建
```typescript
// apps/worker/src/index.ts
workflowEngine.setNodeExecutionListener(async (nodeKey, nodeType, status, result?: NodeExecutionResult) => {
  // Find this node's definition to get config
  const nodeDef = definition.nodes.find((n: any) => n.id === nodeKey);
  const nodeConfig = nodeDef?.config || {};
  let nodeRunId: string | null = null;

  // 按 nodeKey + workflowRunId 查找或插入
  const existing = await db.query.workflowNodeRuns.findFirst({
    where: and(eq(workflowNodeRuns.workflowRunId, runId), eq(workflowNodeRuns.nodeKey, nodeKey)),
  });

  if (existing) {
    await db.update(workflowNodeRuns).set({ status, outputPayload: ..., finishedAt: new Date() })
      .where(eq(workflowNodeRuns.id, existing.id));
    nodeRunId = existing.id;
  } else {
    const [inserted] = await db.insert(workflowNodeRuns).values({ workflowRunId, nodeKey, nodeType, status, ... });
    nodeRunId = inserted.id;
  }

  // Review 节点暂停时创建审核任务
  if (nodeType === 'review' && status === 'waiting_review' && nodeRunId) {
    await db.insert(reviewTasks).values({
      workflowRunId: runId,
      workflowNodeRunId: nodeRunId,
      assigneeUserId: nodeConfig.assigneeUserId || null,
      status: 'pending',
      reviewedOutput: result?.output ? safeJsonSerialize(result.output) : undefined,
    });
  }

  broadcastRunUpdate(runId, { nodeKey, nodeType, status, result: ... });
});
```

### WorkflowEngine.executeFrom() 恢复执行
```typescript
// packages/workflow/src/engine.ts
async executeFrom(definition, nodeId, ctx): Promise<WorkflowExecutionResult> {
  const resumeNode = definition.nodes.find((n) => n.id === nodeId);
  if (!resumeNode) return { status: 'failed', outputs: { error: `Node ${nodeId} not found` } };

  try {
    const nextEdges = definition.edges.filter((e) => e.source === nodeId);
    for (const edge of nextEdges) {
      const nextNode = definition.nodes.find((n) => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(ctx, nextNode, definition);
      }
    }
    return { status: 'success', outputs: ctx.outputs };
  } catch (error) {
    return { status: 'failed', outputs: { ...ctx.outputs, error: error.message } };
  }
}
```

### Worker 向量检索服务
```typescript
// apps/worker/src/index.ts
const retrievalService: RetrievalService = {
  async retrieve(projectId: string, query: string, topK: number) {
    const provider = createLLMProvider('openai', process.env.OPENAI_API_KEY);
    const queryEmbedding = await provider.embed!({ text: query });
    const chunks = await db.query.knowledgeChunks.findMany({
      where: eq(knowledgeChunks.projectId, projectId),
      limit: 100,
    });
    // 余弦相似度计算 + 排序返回 topK
  },
};
```

### Worker 安全序列化
```typescript
function safeJsonSerialize(obj: any): any {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  }));
}
```

### Workflow 引擎输出处理
```typescript
// packages/workflow/src/executors.ts
export class OutputNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    return {
      status: 'success',
      output: JSON.parse(JSON.stringify(ctx.outputs)), // 深拷贝避免循环引用
    };
  }
}
```

### LLM 节点前序上下文注入
```typescript
// packages/workflow/src/executors.ts
export class LLMNodeExecutor implements NodeExecutor {
  async execute(ctx: ExecutionContext, node: WorkflowNode): Promise<NodeExecutionResult> {
    let prompt = node.config.prompt || 'Default prompt';

    // 注入前序节点输出作为上下文
    const prevOutputsEntries = Object.entries(ctx.prevOutputs);
    if (prevOutputsEntries.length > 0) {
      const contextParts = prevOutputsEntries.map(([name, output]) =>
        `[${name}]: ${typeof output === 'object' ? JSON.stringify(output) : output}`
      );
      prompt = `Context from previous steps:\n${contextParts.join('\n')}\n\n---\n\nUser request:\n${prompt}`;
    }

    const result = await provider.generate({ prompt, model, ... });
    return { status: 'success', output: { content: result.content, usage: result.usage, latencyMs: result.latencyMs } };
  }
}
```

### Worker WebSocket 客户端
```typescript
// apps/worker/src/index.ts
const WS_URL = process.env.WS_URL || 'ws://localhost:3002';
let wsClient: WebSocket | null = null;

function getWebSocketClient(): WebSocket {
  if (!wsClient || wsClient.readyState === WebSocket.CLOSED) {
    wsClient = new WebSocket(WS_URL);
    wsClient.on('error', (err: Error) => {
      console.error('WebSocket connection error:', err.message);
      wsClient = null;
    });
  }
  return wsClient;
}
```

---

## 13. 项目一句话总结

AgentOps Studio 是一个功能完整的 AI 自动化运营中台，具备 Workflow Builder 可视化编排、真实 AI Provider 集成、MinIO 文件存储、JWT 认证、节点执行追踪、审核流程和 WebSocket 实时推送等能力，用于展示全栈开发与 AI 应用集成的综合实力。

---

## 14. 最近提交记录

### 提交历史
| Commit | 描述 |
|--------|------|
| `25fb29d` | 修复前端bug：stale closure、添加API方法、实现Run按钮功能 |
| `13303ba` | 增强Dashboard展示和ESLint配置 |
| `8536e5c` | 修复条件节点路由、完善可访问性与错误处理 |
| `5bf0bd2` | 更新HANDOFF文档，添加最近提交记录和构建修复说明 |
| `6afb3ed` | 添加缺失的WS_PORT和WS_URL环境变量 |

### 最近改进

#### 1. 增强 Dashboard 展示 (13303ba)
- **Dashboard 页面重构** (`apps/web/app/page.tsx`)
  - 添加 Recharts 面积图显示执行趋势
  - 新增 StatCard 组件显示趋势指标（+12%, +3%）
  - 添加快速操作按钮（新建工作流、查看执行记录、知识库管理、人工审核）
  - 改进 Recent Runs 列表，显示状态指示器和更多详情
  - 添加 Pending Reviews 面板
  - 添加加载状态旋转图标

- **演示数据增强** (`packages/db/src/seed.ts`)
  - 创建示例项目 "AI Content Generator"
  - 创建示例知识文档和向量块
  - 创建示例 Prompt 模板
  - 创建示例工作流 "Content Review Pipeline"（包含完整节点定义）
  - 创建 5 条不同状态的运行记录（success/pending/failed）

- **ESLint 配置**
  - 配置 ESLint 9.x 兼容 Next.js (`apps/web/eslint.config.mjs`)
  - 修复所有 ESLint 警告

#### 2. 修复前端 Bug (25fb29d)
- **Stale Closure 修复**
  - `workflows/page.tsx` - `handleCreate` 使用函数式 setState
  - `knowledge/page.tsx` - `handleUpload` 使用函数式 setState

- **API 方法扩展** (`apps/web/lib/api.ts`)
  - 添加 `api.knowledge.upload()` - 文件上传到 MinIO
  - 添加 `api.knowledge.process()` - 处理文档生成 chunks

- **Workflows 列表 Run 按钮**
  - 实现 Run 按钮功能，点击后创建运行并跳转到详情页
  - 添加 loading 状态显示

#### 3. 条件节点路由修复 (8536e5c)
- `packages/workflow/src/engine.ts` - 检查 `sourceHandle` 决定走 yes/no 分支
- `packages/db/src/schema.ts` - 添加 `sourceHandle` 字段
- `packages/shared/src/types.ts` - 添加 `sourceHandle` 类型
- `apps/api/src/routes/workflows.ts` - 保存和返回 edges 时包含 `sourceHandle`

### 当前构建状态
```
Tasks:    3 successful, 3 total
Route (app)                              Size     First Load JS
├ ○ /                                    101 kB         216 kB
├ ○ /projects                            2.69 kB        108 kB
├ ○ /runs                                2.6 kB         112 kB
├ ○ /workflows                           3.12 kB        113 kB
├ ƒ /runs/[id]                           3.54 kB        113 kB
├ ƒ /workflows/[id]                      59.4 kB        174 kB
├ ○ /knowledge                           3.83 kB        110 kB
├ ○ /reviews                             3.24 kB        109 kB
├ ○ /prompts                             3.92 kB        110 kB
...
```

### 启动检查清单
- [x] Docker 服务运行中 (PostgreSQL, Redis, MinIO)
- [x] 数据库迁移完成
- [x] 数据库种子已填充（含演示数据）
- [x] 构建通过
- [x] 前端页面全部可访问
- [x] ESLint 检查通过

---

## 15. 前期修复记录

### 条件节点路由修复
修复了工作流引擎中条件节点的路由逻辑：
- **问题**：条件节点执行后，引擎会跟随所有输出边，而不是只跟随与条件结果匹配的边
- **修复**：
  - `packages/workflow/src/engine.ts` - 添加条件节点路由逻辑，检查 `sourceHandle` 来决定走 yes 还是 no 分支
  - `packages/db/src/schema.ts` - 添加 `sourceHandle` 字段到 `workflowEdges` 表
  - `packages/shared/src/types.ts` - 添加 `sourceHandle` 到 `WorkflowEdge` 类型
  - `apps/api/src/routes/workflows.ts` - 保存和返回 edges 时包含 `sourceHandle`
  - `apps/web/components/workflow/editor-store.ts` - 连接边时保存 `sourceHandle`
  - `apps/web/app/workflows/[id]/page.tsx` - 保存时传递 `sourceHandle`

### 可访问性改进
提升了 UI 组件的可访问性（Accessibility）：
- **Navbar** (`apps/web/components/Navbar.tsx`)
  - 添加 `aria-label` 到导航链接
  - 添加 `aria-hidden` 到图标
  - 添加 `role="status"` 和 `aria-live` 到状态提示
- **EditorToolbar** (`apps/web/components/workflow/toolbar.tsx`)
  - 添加 `role="toolbar"` 和 `aria-label`
  - 添加 `aria-busy` 和 `aria-disabled` 属性
  - 添加图标 `aria-hidden`
- **NodeToolbar** - 添加 `aria-label` 和 `title`
- **NodeConfigPanel** (`apps/web/components/workflow/node-config-panel.tsx`)
  - 所有表单输入添加 `id` 和关联的 `htmlFor`
  - 按钮添加 `aria-label`
  - 帮助文本添加 `aria-describedby`

### 错误处理与加载状态
改进了页面的错误处理和加载状态：
- **AuthCheck** (`apps/web/components/auth-check.tsx`)
  - 使用旋转加载图标替代纯文本
  - 添加 `role="status"` 和 `aria-label`
- **RunsPage** (`apps/web/app/runs/page.tsx`)
  - 添加错误状态显示和重试按钮
  - 加载状态使用旋转图标
  - 使用 `role="alert"` 展示错误信息
- **ProjectsPage** (`apps/web/app/projects/page.tsx`)
  - 同上错误处理改进
