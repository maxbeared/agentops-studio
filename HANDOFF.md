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
- `.gitignore`
- `tsconfig.base.json`
- `docker-compose.yml`
- `.env`
- `.env.example`

### apps/api
- `apps/api/src/index.ts`
- `apps/api/src/lib/jwt.ts`
- `apps/api/src/lib/password.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/projects.ts`
- `apps/api/src/routes/knowledge.ts`
- `apps/api/src/routes/workflows.ts`
- `apps/api/src/routes/runs.ts`
- `apps/api/src/routes/dashboard.ts`

### apps/web
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
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
当前 API 为骨架版本，主要包含：

#### 认证
- `POST /auth/register`
- `POST /auth/login`

#### 项目
- `GET /projects`
- `POST /projects`
- `GET /projects/:id`

#### 知识库
- `GET /knowledge`
- `POST /knowledge`
- `GET /knowledge/:id`

#### 工作流
- `GET /workflows`
- `POST /workflows`
- `GET /workflows/:id`
- `POST /workflows/:id/publish`

#### 执行记录
- `GET /runs`
- `POST /runs`
- `GET /runs/:id`
- `GET /runs/:id/nodes`

#### 面板
- `GET /dashboard/stats`

**注意**：当前大多数 route 还是 mock / placeholder，尚未接数据库。

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

当前限制：
- 还没有真正和数据库中的 `workflow_run / workflow_node_run` 打通
- 还没有实际队列调度和持久化记录
- 还没有条件分支细节控制

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

### 5.5 Web 首页
位置：`apps/web/app/page.tsx`

已做：
- 一个深色风格 landing/dashboard 页面
- 展示：项目定位、技术栈、核心模块、示例工作流、统计卡片

价值：
- 作为项目视觉入口可直接演示
- 后续可以逐步扩展成真正控制台

---

## 6. 当前项目状态（2026-03-25 更新）

### ✅ 已完成
1. **依赖安装**：使用 pnpm + workspace:* 成功安装所有依赖
2. **Docker 环境**：PostgreSQL 和 Redis 容器正常运行
3. **数据库迁移**：Drizzle 迁移文件已生成并成功应用到数据库
4. **API 服务**：Bun + Hono API 成功启动，`/health` 端点正常响应
5. **Web 应用**：Next.js 15 成功启动在 http://localhost:3000
6. **Worker 服务**：BullMQ worker 成功启动并连接 Redis

### ⚠️ 已知问题
1. **Next.js bin 文件缺失**：pnpm 安装时 Next.js 的可执行文件链接失败，但通过 `pnpm --filter` 可正常启动
2. **Web 首页未验证**：curl localhost:3000 连接失败，可能是 Next.js 启动较慢或端口问题
3. **MinIO 未启动**：Docker 镜像拉取超时，暂时只启动了 PostgreSQL 和 Redis
4. **pgvector 扩展缺失**：使用 postgres:16-alpine 替代 pgvector/pgvector:pg16，embedding 列暂用 text 占位

### 🔧 环境配置修复记录
- 修改所有 workspace 内部依赖为 `workspace:*` 格式
- 创建 `pnpm-workspace.yaml` 配置文件
- 移除 Next.js 的 `experimental.typedRoutes` 配置（与 turbopack 不兼容）
- 移除 `--turbopack` 启动参数，使用标准 webpack 模式

---

## 7. 当前可确认的文件状态

### 已真实写入并验证的代码
- 项目骨架文件已创建
- 数据库 schema 已定义（17 张表）
- 数据库迁移已生成并应用
- API 路由骨架已创建并可访问
- Web 首页已创建
- Worker 服务已创建并可连接 Redis

### 尚未完成的内容
- API routes 还是 mock 数据，未接入真实数据库 CRUD
- Web 首页未验证实际渲染效果
- 没有跑通从 API -> Queue -> Worker -> Workflow Engine 的完整闭环
- MinIO 对象存储未启动

---

## 8. 下次继续时的优先级顺序

### ✅ 已完成的 Steps
- ~~Step 1：解决环境依赖安装~~ ✓
- ~~Step 2���启动基础设施（PostgreSQL + Redis）~~ ✓
- ~~Step 3：生成数据库迁移~~ ✓
- ~~Step 4：验证 API 服务~~ ✓
- ~~Step 5：验证 Web 服务~~ ✓
- ~~Step 6：验证 Worker 服务~~ ✓

### 🎯 下一步建议

#### Step 7：验证 Web 首页渲染
```bash
# 访问 http://localhost:3000 确认首页正常显示
# 或使用浏览器打开查看
```

#### Step 8：接入真实数据库 CRUD
优先实现以下 API：
1. `POST /projects` - 创建项目（写入数据库）
2. `GET /projects` - 列出项目（从数据库读取）
3. `POST /workflows` - 创建工作流
4. `POST /workflows/:id/publish` - 发布工作流版本

#### Step 9：打通最小业务闭环
1. 通过 API 创建 project
2. 创建 workflow 并 publish
3. 创建 workflow run
4. API 推送任务到 BullMQ
5. Worker 从队列取任务
6. Worker 执行 workflow engine
7. Worker 更新 run 状态到数据库
8. API 返回执行结果

#### Step 10：前端接入 API
1. Dashboard 页面从 `/dashboard/stats` 获取真实数据
2. 创建 Projects 列表页
3. 创建 Workflows 列表页
4. 创建 Run Detail 页面

---

## 9. 推荐的下一阶段开发路线

### 第一阶段：让骨架真正跑起来
- 修 workspace 依赖安装问题
- 启动 docker 基础设施
- 生成 migration
- API / Web / Worker 分别启动成功

### 第二阶段：接入真实数据库
- Projects route 接 Drizzle
- Workflows route 接 Drizzle
- Runs route 接 Drizzle
- Dashboard route 从 DB 聚合

### 第三阶段：异步任务闭环
- `POST /runs` 创建 run 记录
- 推送 BullMQ job
- Worker 执行 workflow
- 更新 `workflow_runs` 与 `workflow_node_runs`

### 第四阶段：前端控制台
- Dashboard 页面真实请求 API
- Knowledge List 页面
- Workflow List 页面
- Run Detail 页面

### 第五阶段：高光功能
- Human Review 页面
- Workflow Builder（React Flow）
- Prompt Template 管理
- 成本统计
- 多模型支持

---

## 10. 当前代码里的关键点提醒

### 10.1 package.json scripts 里用了 `cd`
根目录 `package.json` 里：
- `db:generate`
- `db:migrate`
- `db:studio`

使用了 `cd packages/db && ...`。  
这在当前项目里不一定是致命问题，但如果后续继续自动化操作，最好改成更稳的 workspace 调用方式。

### 10.2 `packages/shared` 导出路径
当前 `packages/shared/src/index.ts` 已导出：
- `types`
- `schemas`

API route 里已经通过 `@agentops/shared` 使用 schema。

### 10.3 Drizzle 里的 embedding 先用 text 占位
`knowledge_chunks.embedding` 目前是 text 占位，不是真正的 pgvector 列。  
这是为了先把骨架搭起来。后续接 pgvector 时需要改 schema。

### 10.4 API 当前是 mock 风格
当前 route 可以视为：
- 输入校验真实存在
- 返回结构大致合理
- 但数据还不是 DB 持久化

### 10.5 Worker 还没更新数据库
当前 Worker 只是：
- 接收 job
- 调用 workflow engine
- 打印结果

还没有：
- 从 DB 读取 workflow version
- 更新 run 状态
- 写 node run 日志

---

## 11. 建议的下一次对话开头方式

下次继续时，可以直接说类似下面这句：

> 继续 AgentOps Studio。请先读取 `HANDOFF.md`，然后从“解决依赖安装和环境启动问题”开始。

或者：

> 继续 AgentOps Studio。先按 `HANDOFF.md` 的 Step 1~Step 4 执行，直到 API 和 Web 能启动。

这样就不用从头重新解释背景。

---

## 12. 项目一句话总结（可用于简历/开场）

AgentOps Studio 是一个面向团队的 AI 自动化运营中台，支持知识库管理、工作流编排、异步执行、人工审核和结果投递，用于展示候选人在 AI 应用集成、全栈开发、系统设计与工程化方面的综合能力。
