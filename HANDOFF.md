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

## 2. 当前推荐技术栈

### 前端
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- 后续可加：shadcn/ui、React Flow、Recharts

### 后端
- Bun
- Hono
- TypeScript

### 数据与基础设施
- PostgreSQL
- Redis
- BullMQ
- Drizzle ORM
- MinIO（S3 兼容）
- Docker Compose

### AI 层
- LLM Provider 抽象
- Prompt 模板渲染
- Embedding 占位实现
- Workflow 节点执行器

---

## 3. 当前项目结构

```txt
agentops-studio/
├── apps/
│   ├── web/          # Next.js 前端
│   ├── api/          # Bun + Hono API
│   └── worker/       # BullMQ Worker
├── packages/
│   ├── shared/       # 共享 types 和 zod schema
│   ├── db/           # Drizzle schema / db client
│   ├── ai/           # AI provider / embeddings / prompt
│   ├── workflow/     # Workflow engine / executors
│   └── config/       # 预留
├── docker-compose.yml
├── package.json
├── turbo.json
├── tsconfig.base.json
├── .env
└── .env.example
```

---

## 4. 已创建的主要文件

### 根目录
- `package.json`
- `turbo.json`
- `pnpm-workspace.yaml`
- `.gitignore`
- `tsconfig.base.json`
- `docker-compose.yml`
- `.env`
- `.env.example`
- `HANDOFF.md`

### apps/api
- `apps/api/src/index.ts`
- `apps/api/src/lib/jwt.ts`
- `apps/api/src/lib/password.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/projects.ts`
- `apps/api/src/routes/knowledge.ts`
- `apps/api/src/routes/workflows.ts`
- `apps/api/src/routes/runs.ts`
- `apps/api/src/routes/reviews.ts`
- `apps/api/src/routes/dashboard.ts`

### apps/web
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/lib/api.ts`
- `apps/web/components/Navbar.tsx`
- `apps/web/app/projects/page.tsx`
- `apps/web/app/workflows/page.tsx`
- `apps/web/app/runs/page.tsx`
- `apps/web/app/runs/[id]/page.tsx`
- `apps/web/app/knowledge/page.tsx`
- `apps/web/app/reviews/page.tsx`
- `apps/web/package.json`
- `apps/web/next.config.mjs`
- `apps/web/tailwind.config.js`
- `apps/web/postcss.config.js`

### apps/worker
- `apps/worker/src/index.ts`

### packages/shared
- `packages/shared/src/types.ts`
- `packages/shared/src/schemas.ts`
- `packages/shared/src/index.ts`

### packages/db
- `packages/db/src/schema.ts`
- `packages/db/src/index.ts`
- `packages/db/src/seed.ts`
- `packages/db/drizzle.config.ts`

### packages/ai
- `packages/ai/src/types.ts`
- `packages/ai/src/providers.ts`
- `packages/ai/src/embeddings.ts`
- `packages/ai/src/prompt.ts`
- `packages/ai/src/index.ts`

### packages/workflow
- `packages/workflow/src/types.ts`
- `packages/workflow/src/executors.ts`
- `packages/workflow/src/engine.ts`
- `packages/workflow/src/index.ts`

---

## 5. 当前已经完成的设计

### 5.1 数据模型设计
已经在 `packages/db/src/schema.ts` 中定义了核心业务表，包括：

- `users`
- `organizations`
- `organization_members`
- `projects`
- `knowledge_documents`
- `knowledge_chunks`
- `prompt_templates`
- `workflows`
- `workflow_versions`
- `workflow_nodes`
- `workflow_edges`
- `workflow_runs`
- `workflow_node_runs`
- `review_tasks`
- `delivery_jobs`
- `model_providers`
- `audit_logs`

这些表覆盖了：
- 用户与组织
- 项目空间
- 知识库
- 工作流定义
- 工作流执行追踪
- 审核任务
- 投递任务
- 模型配置
- 审计日志

---

### 5.2 API 设计
API 已接入真实数据库，主要包含：

#### 认证
- `POST /auth/register` (mock)
- `POST /auth/login` (mock)

#### 项目
- `GET /projects` - 从数据库读取
- `POST /projects` - 写入数据库
- `GET /projects/:id` - 获取单个项目
- `DELETE /projects/:id` - 删除项目

#### 知识库
- `GET /knowledge` - 从数据库读取
- `POST /knowledge` - 写入数据库
- `GET /knowledge/:id` - 获取文档详情

#### 工作流
- `GET /workflows` - 从数据库读取
- `POST /workflows` - 创建工作流
- `GET /workflows/:id` - 获取工作流(含定义)
- `POST /workflows/:id/publish` - 发布版本，保存节点和边

#### 执行记录
- `GET /runs` - 从数据库读取
- `POST /runs` - 创建运行记录并加入 BullMQ 队列
- `GET /runs/:id` - 获取运行详情
- `GET /runs/:id/nodes` - 获取节点执行结果

#### 审核任务
- `GET /reviews` - 获取审核任务列表
- `GET /reviews/:id` - 获取审核任务详情

#### 面板
- `GET /dashboard/stats` - 从数据库聚合统计

---

### 5.3 Workflow 引擎设计
位置：`packages/workflow/`

已完成：
- `WorkflowEngine`
- `NodeExecutor` 抽象接口
- 以下 executor 的初版：
  - `StartNodeExecutor`
  - `LLMNodeExecutor`
  - `RetrievalNodeExecutor`
  - `ConditionNodeExecutor`
  - `ReviewNodeExecutor`
  - `WebhookNodeExecutor`
  - `OutputNodeExecutor`

当前实现特点：
- 简化版 DAG 执行
- 从 start node 开始递归执行
- 执行结果写入 `ctx.state`
- review 节点返回 `waiting_review`

---

### 5.4 AI 抽象层设计
位置：`packages/ai/`

已完成：
- `LLMProvider` 接口
- `MockLLMProvider`
- `generateEmbedding()` 占位实现
- `renderPrompt()` 模板替换

当前状态：
- 仍是 mock 版本
- 尚未接入 OpenAI / Anthropic / Gemini

---

### 5.5 Web 前端页面
位置：`apps/web/app/`

已完成页面：
- `/` - Dashboard 首页（从 API 获取统计数据）
- `/projects` - 项目列表
- `/workflows` - 工作流列表（含状态 Badge）
- `/runs` - 执行记录列表（表格形式，可点击跳转）
- `/runs/[id]` - 执行详情页（含节点执行日志）
- `/knowledge` - 知识库文档列表
- `/reviews` - 人工审核任务列表

共享组件：
- `components/Navbar.tsx` - 全局导航栏

---

## 6. 当前项目状态（2026-03-26 更新）

### ✅ 已完成
1. **依赖安装**：使用 pnpm + workspace:* 成功安装所有依赖
2. **Docker 环境**：PostgreSQL、Redis、MinIO 容器正常运行
3. **数据库迁移**：Drizzle 迁移文件已生成并成功应用到数据库
4. **数据库种子**：创建演示用户和组织
5. **API 服务**：Bun + Hono API 成功启动，接入真实数据库
6. **Web 应用**：Next.js 15 成功启动在 http://localhost:3000
7. **Worker 服务**：BullMQ worker 运行中，可执行工作流
8. **API 路由**：Projects、Workflows、Runs、Knowledge、Reviews、Dashboard 均接入 DB
9. **前端页面**：6 个页面完整实现，导航链接可跳转

### ⚠️ 已知问题
1. **Next.js bin 文件缺失**：pnpm 安装时 Next.js 的可执行文件链接失败，但通过 `pnpm --filter` 可正常启动
2. **bcrypt 原生模块**：在 Bun 中有问题，改用 bcryptjs
3. **pgvector 扩展缺失**：embedding 列暂用 text 占位
4. **MinIO 未验证**：容器已启动但未测试上传功能
5. **部分 LSP 错误**：API routes 中有隐式 any 类型警告

### 🔧 环境配置修复记录
- 修改所有 workspace 内部依赖为 `workspace:*` 格式
- 创建 `pnpm-workspace.yaml` 配置文件
- 移除 Next.js 的 `experimental.typedRoutes` 配置
- 移除 `--turbopack` 启动参数
- 依赖安装修复：bcrypt → bcryptjs
- API 添加 drizzle-orm、bullmq、ioredis 依赖

---

## 7. 当前可确认的文件状态

### 已完成并验证
- 项目骨架文件
- 数据库 schema（17 张表）
- 数据库迁移
- 数据库种子脚本
- API 路由（真实 DB CRUD + BullMQ 队列）
- Web 页面（6 个页面 + 导航组件）
- Worker 服务（队列消费 + DB 更新）

### 尚未完成的内容
- Auth 路由（register/login）仍是 mock
- 审核任务操作（approve/reject）未实现
- 知识库文档上传和 chunk 处理
- MinIO 对象存储集成
- Workflow Builder 可视化编辑器
- Prompt Template 管理页面
- 真实 AI Provider 接入（OpenAI/Anthropic/Gemini）

---

## 8. 开发进度

### ✅ 已完成的 Steps
- ~~Step 1：解决环境依赖安装~~ ✓
- ~~Step 2：启动基础设施（PostgreSQL + Redis）~~ ✓
- ~~Step 3：生成数据库迁移~~ ✓
- ~~Step 4：验证 API 服务~~ ✓
- ~~Step 5：验证 Web 服务~~ ✓
- ~~Step 6：验证 Worker 服务~~ ✓
- ~~Step 7：验证 Web 首页渲染~~ ✓
- ~~Step 8：接入真实数据库 CRUD~~ ✓
- ~~Step 9：打通最小业务闭环（API → Queue → Worker → DB）~~ ✓
- ~~Step 10：前端接入 API~~ ✓
- ~~Step 11：扩展前端页面（Knowledge、Reviews）~~ ✓
- ~~Step 12：添加全局导航栏~~ ✓

### 🎯 下一步建议

#### 高优先级
1. **Workflow Builder**：React Flow 可视化编辑器
2. **Auth 完善**：JWT 登录注册，真实用户系统
3. **知识库上传**：MinIO 集成，文档处理 pipeline

#### 中优先级
1. **审核操作**：approve/reject 功能和页面
2. **Prompt 管理**：模板 CRUD 页面
3. **真实 AI 接入**：OpenAI/Anthropic Provider

#### 低优先级
1. **成本统计**：更详细的成本分析
2. **多模型支持**：Provider 切换
3. **WebSocket 实时**：执行状态实时推送

---

## 9. 推荐的下一阶段开发路线

### 第一阶段：核心功能完善
- Workflow Builder（React Flow）
- Auth 登录注册
- 知识库上传 pipeline

### 第二阶段：业务闭环
- 审核操作功能
- 投递任务集成
- Webhook 执行

### 第三阶段：高光功能
- 真实 AI Provider 接入
- Prompt Template 管理
- 成本统计分析

---

## 10. 当前代码里的关键点提醒

### 10.1 Demo 用户 ID 硬编码
部分 API route 中硬编码了演示用户 ID：
```
DEMO_USER_ID = 'e8ca6b17-b3f9-447d-9753-0f2632e8fedc'
DEMO_ORG_ID = '12eccb6c-2266-49ff-930d-224a5f9770e7'
```
后续需要从 JWT token 中解析真实用户 ID。

### 10.2 BullMQ 队列使用
- API 使用 `workflowQueue.add()` 添加任务
- Worker 使用 `new Worker('workflow-execution', ...)` 消费
- 任务数据包含 `runId`、`workflowVersionId`、`definition`、`input`

### 10.3 Drizzle 里的 embedding 先用 text 占位
`knowledge_chunks.embedding` 目前是 text 占位，不是真正的 pgvector 列。  
后续接 pgvector 时需要改 schema。

### 10.4 Worker 安全序列化
Worker 中使用 `safeJsonSerialize()` 函数处理循环引用：
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

### 10.5 API 端点前缀
- API 运行在 `http://localhost:3001`
- Web 运行在 `http://localhost:3000`
- 前端通过 `NEXT_PUBLIC_API_URL` 环境变量配置 API 地址

---

## 11. 服务启动命令

```bash
# 启动 Docker 基础设施
docker-compose up -d

# 数据库迁移
pnpm db:migrate

# 数据库种子
pnpm db:seed

# 启动 API
cd apps/api && bun run src/index.ts

# 启动 Worker
cd apps/worker && bun run src/index.ts

# 启动 Web
cd apps/web && pnpm dev
```

---

## 12. 项目一句话总结

AgentOps Studio 是一个面向团队的 AI 自动化运营中台，支持知识库管理、工作流编排、异步执行、人工审核和结果投递，用于展示候选人在 AI 应用集成、全栈开发、系统设计与工程化方面的综合能力。
