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
| `password.ts` | bcrypt 密码哈希 |
| `minio.ts` | MinIO 客户端封装 |
| `websocket.ts` | WebSocket 服务端 |

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
4. 执行结果存入 `ctx.state`
5. 通过 NodeExecutionListener 回调记录每个节点执行到数据库

### AI Provider 自动选择
```typescript
if (model.startsWith('claude-')) return AnthropicProvider;
if (model.startsWith('gpt-') || model.startsWith('o1')) return OpenAIProvider;
return MockLLMProvider;
```

---

## 8. WebSocket 实时推送

### 服务
- 独立服务 `websocket-server.ts` 监听 `localhost:3002`
- 使用 `ws` 库

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
pnpm db:migrate

# 3. 数据库种子
pnpm db:seed

# 4. 启动 API (localhost:3001)
cd apps/api && bun run src/index.ts

# 5. 启动 WebSocket (localhost:3002)
pnpm ws

# 6. 启动 Worker
cd apps/worker && bun run src/index.ts

# 7. 启动 Web (localhost:3000)
cd apps/web && pnpm dev
```

---

## 11. 已完成功能清单

### ✅ 核心功能
- [x] 数据库 schema（17 张表）+ 迁移 + 种子
- [x] JWT Auth（注册/登录/用户状态）
- [x] 项目/工作流/执行记录 CRUD（全部使用 JWT 认证）
- [x] Workflow Builder（React Flow 可视化编辑器）
- [x] 知识库 + MinIO 文件上传
- [x] 审核任务 + approve/reject
- [x] Prompt 模板管理
- [x] BullMQ 异步任务队列
- [x] 真实 AI Provider（OpenAI + Anthropic）
- [x] WebSocket 实时推送
- [x] Run 详情页自动轮询
- [x] Worker 节点执行记录到数据库
- [x] Workflow 引擎支持节点执行监听器回调
- [x] 前端路由守卫组件（auth-check）

### ⚠️ 已知限制
- `knowledge_chunks.embedding` 使用 text 占位，非 pgvector
- Worker 到 WebSocket 的广播暂未实现（可直接在 Worker 内调用 ws）
- 部分 LSP 类型警告未完全消除（accessibility 和 button type）

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

### Worker 节点执行记录
```typescript
// apps/worker/src/index.ts
workflowEngine.setNodeExecutionListener(async (nodeKey, nodeType, status, result?: NodeExecutionResult) => {
  await db.insert(workflowNodeRuns).values({
    workflowRunId: runId,
    nodeKey,
    nodeType,
    status,
    inputPayload: safeJsonSerialize(input || {}),
    outputPayload: result?.output ? safeJsonSerialize(result.output) : undefined,
    durationMs: result?.latencyMs,
    tokenUsageInput: result?.usage?.inputTokens || 0,
    tokenUsageOutput: result?.usage?.outputTokens || 0,
    cost: result?.usage?.cost?.toString() || '0',
  });
});
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

---

## 13. 项目一句话总结

AgentOps Studio 是一个功能完整的 AI 自动化运营中台，具备 Workflow Builder 可视化编排、真实 AI Provider 集成、MinIO 文件存储、JWT 认证、节点执行追踪、审核流程和 WebSocket 实时推送等能力，用于展示全栈开发与 AI 应用集成的综合实力。