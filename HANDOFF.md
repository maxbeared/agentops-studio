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
│   └── workflow/     # Workflow interpreter / plan executor
├── tests/            # E2E/UI/安全/性能测试
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
| `ai.ts` | AI 工作流生成/修改/解读（流式 SSE） |
| `ai-model-config.ts` | AI 模型配置 CRUD |

### API 库 (`apps/api/src/lib/`)
| 文件 | 功能 |
|------|------|
| `auth.ts` | JWT 用户认证解析（getAuthUser） |
| `jwt.ts` | JWT 签名/验证 |
| `password.ts` | bcryptjs 密码哈希 |
| `minio.ts` | MinIO 客户端封装 + uploadAvatar 头像上传 |
| `websocket.ts` | WebSocket 服务端 + 广播函数 |

### WebSocket (`apps/api/src/`)
| 文件 | 功能 |
|------|------|
| `websocket-server.ts` | 独立 WebSocket 服务 (localhost:3002) |

### 前端页面 (`apps/web/app/`)

| 路径 | 功能 |
|------|------|
| `/` | 营销首页（AI 工作流创建输入 + 炫酷展示页面） |
| `/dashboard` | Dashboard 仪表盘（需登录） |
| `/projects` | 项目列表（需登录） |
| `/workflows` | 工作流列表（需登录） |
| `/workflows/[id]` | Workflow Builder 可视化编辑器 + AI Chat Panel（需登录） |
| `/runs` | 执行记录列表（需登录） |
| `/runs/[id]` | Run 详情 + 自动轮询（需登录） |
| `/knowledge` | 知识库 + 文件上传（需登录） |
| `/prompts` | Prompt 模板管理（需登录） |
| `/reviews` | 审核任务列表 + approve/reject（需登录） |
| `/auth/login` | 登录页 |
| `/auth/register` | 注册页 |
| `/settings` | 设置页面（Profile/AIModels Tab）+ 头像上传裁剪 |

### 落地页设计规范 (`apps/web/app/page.tsx`)

**视觉风格**：深色赛博朋克 + 霓虹发光效果 + AI 工作流创建

#### AI 工作流创建区域

| 组件 | 功能 |
|------|------|
| `AICreatorInput` | 单行输入框，border-bottom 样式，回车跳转登录/创建 |

**布局结构**：
- Hero 区域：标题 + 副标题（左对齐）+ AI 输入框 + 两个按钮
- Ready 区域：标题 + 副标题（左对齐）+ AI 输入框 + 两个按钮
- 按钮：开始使用（填充色）+ 仪表盘/查看案例（边框样式）

**按钮逻辑**：
- 登录后：开始使用（跳转 /projects）+ 仪表盘（跳转 /dashboard）
- 未登录：开始使用（跳转 /auth/login）+ 查看案例（跳转 /workflows）

**输入框逻辑**：
- 回车时将描述存入 localStorage（24小时过期）
- 未登录时跳转登录页，登录后恢复描述

**响应式字体**：
- 标题使用 `clamp()` 限制最大字号（320px）
- 小屏幕用更大的 vw 值确保可读性

#### 核心组件

| 组件 | 功能 |
|------|------|
| `GlitchBars` | 全屏故障条动画，支持禁用模式（固定位置不消失） |
| `GlitchText` | 文字 RGB 分离故障效果，支持禁用模式（固定分块），偏移量使用 em 单位 |
| `CrashCard` | 卡片从屏幕两侧飞入碰撞弹开效果，碰撞后发光效果衰减（1.5秒），上边框衰减到 0.3 |
| `TimelineItem` | 能力区域时间线左右交替布局，图标无放大效果 |
| `FloatingStat` | 统计数据圆形悬浮 + 旋转光环，角度限制在 ±30° 内 |
| `RevealSection` | 滚动视差淡入动画 |

#### 设计特点
- **配色**：高饱和度霓虹色（#00e5ff 青、#ff4081 粉、#69f0ae 绿等）
- **故障效果**：可开关控制（导航栏 ZapOff 按钮），localStorage 持久化状态
- **Logo 动画**：纯发光效果，无 RGB 分离，3 秒周期柔和变化
- **卡片动画**：左右两列卡片从相反方向飞向中心，碰撞后弹开产生随机倾斜；碰撞后外发光效果持续 1.5 秒衰减，上边框最终衰减到 0.3 透明度
- **图标设计**：卡片内大型半透明图标作为背景（hover 时透明度 0.8），底部装饰条动画
- **时间线**：中央节点图标 + 两侧卡片交替排列，hover 展开详细说明，图标无放大效果
- **统计数据**：圆形边框 + 旋转光环（限制在 ±30° 内）+ 悬浮抖动动画
- **i18n**：导航栏 Globe 图标切换中英文，localStorage 持久化

#### 动画时序
- 页面加载 → 主标题故障效果（~2.5-4.5s 间隔，每帧 500ms）
- 滚动至 CORE 区域 → 卡片飞入碰撞动画，碰撞后发光效果持续 1.5 秒衰减
- 滚动至 POWER 区域 → 时间线节点交替淡入
- 滚动至统计区域 → 圆形悬浮 + 旋转光环
- 离开主标题区域 → 故障条频率大幅降低

#### 动画开关
- 导航栏提供 ZapOff 图标按钮控制故障动画开关
- 状态保存到 localStorage，刷新后保持
- 禁用时：故障条固定位置显示（absolute 定位），GlitchText 显示固定 RGB 分离效果

### 共享 UI 组件 (`apps/web/components/ui/`)

| 组件 | 功能 |
|------|------|
| `PageHeader` | 统一页面头部（标题 + 副标题 + 操作按钮） |
| `Card` | 统一卡片样式，支持发光效果 |
| `Button` | 统一按钮样式（primary/secondary/danger/ghost 变体） |
| `StatusBadge` | 状态徽章（success/warning/error/info 变体） |
| `LoadingState` | 加载状态显示 |
| `EmptyState` | 空状态显示（图标 + 标题 + 描述 + 操作） |
| `RevealSection` | 滚动淡入动画 |
| `useInView` | 视口观察 Hook |

**设计风格**：深色锌色背景（bg-zinc-950）+ 青色强调色（#00e5ff）+ 霓虹发光效果

### 前端组件 (`apps/web/components/`)
| 文件 | 功能 |
|------|------|
| `Navbar.tsx` | 全局导航栏（fixed定位，使用CSS变量--navbar-height动态高度） |
| `language-switcher.tsx` | 语言切换下拉选择器 |
| `ui/index.tsx` | 共享 UI 组件库（Button children改为可选） |
| `providers.tsx` | 组合 Provider（Locale + Auth） |
| `auth-check.tsx` | 路由守卫（未登录重定向） |
| `avatar-upload.tsx` | Canvas 头像裁剪上传（缩放/拖拽/S3存储） |
| `workflow/editor-store.ts` | Zustand 工作流编辑器状态（直接同步ReactFlow） |
| `workflow/nodes.tsx` | React Flow 自定义节点（15种类型，仅显示图标+标签，横向连接） |
| `workflow/node-config-panel.tsx` | 节点配置面板（右侧边栏，仅选中节点时显示，自动隐藏） |
| `workflow/toolbar.tsx` | 节点添加工具栏（14种节点类型按钮直接展示，可换行） |
| `workflow/workflow-editor.tsx` | ReactFlow画布组件（验证状态栏、边选中删除按钮、横向贝塞尔曲线） |
| `workflow/ai-chat-panel.tsx` | AI Chat Panel（自然语言创建/修改工作流） |
| `workflow/version-history-panel.tsx` | 版本历史面板（显示 AI/手动版本，支持恢复） |
| `workflow/validation.ts` | 工作流验证规则引擎（7条规则：唯一开始/可达性/条件分支等） |

### 工作流系统架构（重大重构）

**核心理念转变**：工作流从"执行蓝图"变为"需求文档/流程图"

| 组件 | 功能 |
|------|------|
| `WorkflowInterpreter` | 解读工作流定义，生成自然语言描述，调用 LLM 生成执行计划 |
| `PlanExecutor` | 根据执行计划执行步骤，支持 pause/resume，Actions: llm/retrieval/webhook/code/output/ai_review |

**BullMQ 队列**：
| 队列名 | 功能 |
|--------|------|
| `workflow-interpret` | 解读工作流生成执行计划 |
| `workflow-execution` | 执行工作流（基于计划） |
| `workflow-continue` | 审核批准后继续执行 |

### 上下文 (`apps/web/contexts/`)
| 文件 | 功能 |
|------|------|
| `auth-context.tsx` | AuthProvider 用户状态管理 |
| `locale-context.tsx` | LocaleProvider + useTranslation hook |

### i18n 国际化 (`apps/web/`)
| 文件 | 功能 |
|------|------|
| `messages/en.json` | 英文翻译（含 landing/dashboard 等所有页面） |
| `messages/zh.json` | 中文翻译（含 landing/dashboard 等所有页面） |
| `i18n/index.ts` | next-intl 配置 |
| `i18n/provider.tsx` | NextIntlClientProvider 封装 |
| `contexts/locale-context.tsx` | LocaleProvider + useTranslation hook |
| `components/language-switcher.tsx` | 语言切换组件 |
| `components/providers.tsx` | 组合 Provider（Locale + Auth） |

---

## 5. 数据模型（19 张表）

- `users` - 用户
- `organizations` - 组织
- `organization_members` - 组织成员
- `projects` - 项目
- `knowledge_documents` - 知识库文档
- `knowledge_chunks` - 知识块（embedding 占位 text）
- `prompt_templates` - Prompt 模板
- `workflows` - 工作流定义
- `workflow_versions` - 工作流版本（含 source: manual/ai_generated/ai_modified）
- `workflow_nodes` - 工作流节点
- `workflow_edges` - 工作流边
- `workflow_runs` - 工作流运行记录（含 interpretationPrompt/executionPlan）
- `workflow_node_runs` - 节点执行记录
- `review_tasks` - 审核任务
- `delivery_jobs` - 投递任务
- `model_providers` - 模型提供商配置
- `ai_model_configs` - AI 模型配置（provider/endpoint/apiKey/defaultModel）
- `workflow_modifications` - AI 修改记录
- `audit_logs` - 审计日志

---

## 6. API 路由清单

### 认证 `POST /auth/`
| 端点 | 功能 |
|------|------|
| `/register` | 注册 + 创建组织 + 返回 JWT |
| `/login` | 登录验证 + 返回 JWT |
| `/me` | 获取当前用户信息 |
| `/profile` PUT | 更新用户资料（name/avatarUrl） |
| `/password` PUT | 修改密码 |
| `/avatar` POST | 上传头像到 S3，返回 S3 URL |

### 项目 `GET|POST /projects/`
| 端点 | 功能 |
|------|------|
| `GET /` | 列表（需 JWT） |
| `POST /` | 创建（需 JWT，organizationId 可选） |
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

### AI 工作流 `POST /ai/`
| 端点 | 功能 |
|------|------|
| `/workflows/generate` | AI 生成工作流（流式 SSE） |
| `/workflows/modify` | AI 修改工作流（流式 SSE） |
| `/runs/interpret` | 解读工作流生成执行计划 |

### AI 模型配置 `GET|POST|PUT|DELETE /ai/model-configs`
| 端点 | 功能 |
|------|------|
| `GET /` | 列表（需 JWT） |
| `POST /` | 创建配置 |
| `PUT /:id` | 更新配置 |
| `DELETE /:id` | 删除配置 |

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

## 7. Workflow 系统（重构后）

### 节点类型

| 节点类型 | 功能 | 说明 |
|----------|------|------|
| `start` | 开始节点 | 初始化输入（不可删除） |
| `llm` | AI 模型调用 | 自动选择 OpenAI/Anthropic |
| `retrieval` | 知识检索 |  |
| `condition` | 条件分支 | 支持动态条件 |
| `review` | 人工/AI 审核 | 支持 human_review/ai_review 配置 |
| `webhook` | HTTP 请求 |  |
| `output` | 输出结果 |  |
| `input` | 输入节点 | 定义输入 schema |
| `text` | 文本处理 | trim/upper/lower/split/replace |
| `loop` | 循环节点 | 支持 break/continue |
| `delay` | 延时节点 | 毫秒/秒/分钟/小时 |
| `transform` | 数据转换 | 模板渲染 |
| `code` | 代码执行 | 沙箱 JS |
| `merge` | 合并节点 | all/first/last 策略 |
| `errorHandler` | 错误处理 |  |

### WorkflowInterpreter
```typescript
// packages/workflow/src/interpreter.ts
class WorkflowInterpreter {
  async interpret(definition: WorkflowDefinition, input: Record<string, any>): Promise<InterpretationResult>
}
```

### PlanExecutor
```typescript
// packages/workflow/src/plan-executor.ts
class PlanExecutor {
  async execute(plan: ExecutionPlan, input: Record<string, any>, callbacks?: PlanCallbacks): Promise<ExecutionResult>
}
```

### 执行流程
1. API 调用 `/ai/runs/interpret` 解读工作流生成执行计划
2. PlanExecutor 按计划执行步骤
3. Review 节点暂停，等待审核
4. 审核批准后，workflow-continue 队列继续执行

### BullMQ 队列
| 队列名 | 功能 |
|--------|------|
| `workflow-interpret` | 解读工作流 |
| `workflow-execution` | 执行工作流（基于计划） |
| `workflow-continue` | 审核批准后继续执行 |

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
S3_PUBLIC_URL=http://localhost:9000/agentops
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

## 11. 测试体系

### 测试框架

| 维度 | 框架 | 用途 |
|------|------|------|
| 单元测试 | Vitest | packages 独立模块测试 |
| 集成测试 | Vitest + Honosupertest | API 路由测试 |
| E2E 测试 | Playwright | 完整用户流程 |
| 安全测试 | Playwright | API 安全测试 |
| 可访问性 | Playwright + axe-core | WCAG 合规检查 |
| 性能测试 | k6 | API 负载测试 |
| 视觉回归 | Playwright | UI 一致性 |

### 测试文件结构

```
tests/
├── e2e/                    # E2E 测试
│   └── landing.spec.ts
├── a11y/                   # 可访问性测试
│   └── landing.spec.ts
├── security/               # 安全测试
│   └── api-security.spec.ts
├── visual/                 # 视觉回归测试
│   └── landing.spec.ts
└── perf/                   # 性能测试
    └── api-load-test.js
```

### 测试命令

```bash
# 运行所有测试
pnpm test

# 单元测试 (packages)
pnpm test:unit

# 集成测试 (API 路由)
pnpm test:integration

# E2E 测试 (需启动应用)
pnpm test:e2e

# 覆盖率报告
pnpm test:coverage
```

### 测试配置

- `vitest.config.ts` - Vitest 配置
- `playwright.config.ts` - Playwright 配置
- `lighthouse-budget.json` - Lighthouse 性能预算
- `.env.test` - 测试环境变量

### 测试状态

**当前状态：Vitest 路由集成测试全部通过**

| 测试文件 | 通过 | 状态 |
|----------|------|------|
| `auth.test.ts` | 36 | ✅ 稳定 |
| `dashboard-projects.test.ts` | 14 | ✅ 稳定 |
| `workflows-runs.test.ts` | 14 | ✅ 稳定 |
| `reviews-knowledge.test.ts` | 15 | ✅ 稳定 |
| **Vitest API 测试总计** | **79** | **✅ 全部通过** |

**Playwright E2E/Security/Visual 测试**
| 测试类型 | 通过 | 跳过 | 失败 |
|----------|------|------|------|
| E2E Tests | 21 | 0 | 0 |
| Security Tests | 11 | 0 | 0 |
| Visual Tests | 7 | 0 | 0 |
| **Playwright 测试总计** | **39** | **0** | **0** |

**auth.ts 覆盖率**
| 指标 | 覆盖率 |
|------|--------|
| Statements | 92.92% |
| Branches | 90.16% |
| Functions | 100% |
| Lines | 92.79% |
| 未覆盖行 | 51-84, 203 |

> **2026-04-03 auth.test.ts 稳定性修复记录**
> - 问题：5 个 auth 路由测试在 coverage 模式下随机失败（错误密码/无效 token/上传失败等分支返回 200 而非预期状态码）
> - 根因：mock 拦截层不稳定，跨测试共享状态导致覆盖范围差异
> - 修复策略：
>   1. 使用 `vi.hoisted()` 定义模块级函数 mock，替代可变共享对象
>   2. mock 目标精确指向路由实际导入的本地包装模块（`../lib/password`、`../lib/jwt`、`../lib/minio`），而非间接 SDK
>   3. `beforeEach` 中对每个函数 mock 执行 `mockReset()` + `mockResolvedValue()` 确定性重置
>   4. 分支覆盖使用 `mockResolvedValueOnce()` 单次行为覆盖
> - 验证：`pnpm vitest run apps/api/src/test/auth.test.ts` + coverage 模式均 36 passed

### CI/CD

GitHub Actions 自动运行测试套件 (`.github/workflows/test.yml`)

---

## 12. 生产部署

### 部署文件

| 文件 | 说明 |
|------|------|
| `Dockerfile.api` | API 服务 Docker 镜像 |
| `Dockerfile.web` | Next.js Web 前端 Docker 镜像 |
| `Dockerfile.worker` | Worker 服务 Docker 镜像 |
| `docker-compose.prod.yml` | 生产环境完整编排（PostgreSQL + Redis + MinIO + API + Web + Worker + Nginx） |
| `nginx/nginx.conf` | Nginx 反向代理配置（WebSocket 支持） |
| `ecosystem.config.js` | PM2 进程管理（非 Docker 部署用） |
| `.env.production.example` | 生产环境变量模板 |
| `deploy.sh` | 一键部署脚本 |
| `Makefile` | 简化部署命令 |
| `SERVER_SETUP.md` | 详细服务器部署指南 |

### 部署方式

**方式一：Make 命令**

```bash
make build     # 构建镜像
make migrate   # 数据库迁移
make start     # 启动服务
```

**方式二：部署脚本**

```bash
./deploy.sh
```

### 部署到服务器步骤

1. 上传代码到服务器
2. 配置环境变量：
   ```bash
   cp .env.production.example .env.production
   nano .env.production  # 修改必填项
   ```
3. 运行部署：
   ```bash
   ./deploy.sh
   ```

详细说明参考 [SERVER_SETUP.md](SERVER_SETUP.md)

### 安全中间件

API 添加了请求体大小限制中间件（1MB），位于 `apps/api/src/index.ts`：

```typescript
// Body size limit middleware (1MB)
app.use('*', async (c, next) => {
  const contentLength = c.req.header('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) {
    return c.json({ error: { formErrors: ['Request body too large'] } }, 413);
  }
  await next();
});
```

### Dashboard 401 重定向

Dashboard 页面现在会在 API 返回 401 时正确重定向到登录页：

```typescript
// apps/web/app/dashboard/page.tsx
useEffect(() => {
  const errorMessage = error?.message || (error as { message?: string })?.message;
  if (isError && errorMessage === 'Unauthorized') {
    window.location.href = '/auth/login';
  }
}, [isError, error]);
```

---

## 12. 已完成功能清单

### ✅ 核心功能
- [x] 数据库 schema（19 张表）+ 迁移 + 种子
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
- [x] **国际化 (i18n) 支持** - 中英文切换，语言偏好 localStorage 持久化
- [x] **落地页全面重构** - 赛博朋克风格，故障效果，卡片碰撞动画，时间线，统计数据圆形悬浮
- [x] **React Query 数据层优化** - 引入 TanStack Query，统一数据获取，1分钟staleTime缓存，Dashboard API N+1查询优化
- [x] **工作流编辑器重构** - ReactFlow直接同步Zustand Store，移除中间状态层，修复画布高度计算
- [x] **节点配置面板中文化** - 所有节点类型配置项支持中英文双语显示
- [x] **布局溢出修复** - 移除 body/layout overflow:hidden，恢复页面滚动
- [x] **Projects页面CRUD** - 完善项目管理界面与功能
- [x] **工作流编辑器大改版** - 布局重构，NodeConfigPanel右侧边栏，验证面板内嵌工具栏
- [x] **工具栏节点按钮化** - 14种节点类型直接展示，无需下拉菜单，可换行
- [x] **节点横向连接** - 所有节点改为Left输入/Right输出方向
- [x] **边选中删除** - 选中边显示中点删除按钮，hover/选中高亮效果
- [x] **工作流验证系统** - 7条验证规则（唯一开始/可达性/条件分支/孤立节点等）
- [x] **8种新节点类型** - input/text/loop/delay/transform/code/merge/errorHandler + 对应Executor
- [x] **Start节点保护** - 不可删除，标签随语言动态切换
- [x] **Undo/Redo历史** - Ctrl+Z/Y 快捷键，50步历史记录
- [x] **键盘Delete删除节点** - 选中节点时按Delete删除
- [x] **中英文国际化完善** - 验证信息/节点配置全部中英双语
- [x] **工作流系统重构** - 从执行引擎转为需求文档/流程图
- [x] **AI Chat Panel** - 自然语言创建/修改工作流
- [x] **Version History Panel** - 显示 AI/手动版本，支持恢复
- [x] **AI 模型配置 API** - CRUD 端点管理 AI 模型配置
- [x] **首页 AI 工作流创建** - AICreatorInput 单行输入，回车存储 localStorage 跳转登录
- [x] **首页响应式字体** - 使用 clamp() 限制最大字号，避免在小屏幕上过大
- [x] **设置页面** - Profile/AIModels Tab，含个人信息修改、AI模型配置
- [x] **头像上传裁剪** - Canvas 缩放/裁剪，拖拽调整，S3 存储
- [x] **修改密码** - PUT /auth/password，验证原密码
- [x] **头像 S3 存储** - base64 转存到 MinIO，avatarUrl 改为 text 类型
- [x] **AI 模型配置管理** - AI Models Tab，CRUD 配置 OpenAI/Anthropic/Custom 模型
- [x] **Dashboard Recharts 懒加载** - 将图表库拆分为独立组件 dynamic import，减少首屏编译时间（1833→1797 模块）
- [x] **自动化测试体系** - Vitest 单元/集成测试 + Playwright E2E/UI 测试 + k6 性能测试 + GitHub Actions CI/CD
- [x] **Docker 生产部署配置** - Dockerfile、docker-compose.prod.yml、Nginx、部署脚本

### ⚠️ 已知限制
- `knowledge_chunks.embedding` 存储为 JSON 序列化的 float array（text 类型），非 pgvector
- API 生产构建需要处理 MinIO 可选依赖（开发模式不受影响）
- 部分 accessibility 属性待完善（aria-label 等）

---

## 13. 代码关键点

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

### WorkflowInterpreter 解读流程
```typescript
// packages/workflow/src/interpreter.ts
async interpret(definition: WorkflowDefinition, input: Record<string, any>): Promise<InterpretationResult> {
  // 1. 将工作流定义为自然语言
  const description = this.describeWorkflow(definition);
  // 2. 调用 LLM 生成执行计划
  const plan = await this.llm.generateExecutionPlan(description, input);
  return { description, plan };
}
```

### PlanExecutor 执行流程
```typescript
// packages/workflow/src/plan-executor.ts
async execute(plan: ExecutionPlan, input: Record<string, any>, callbacks?: PlanCallbacks): Promise<ExecutionResult> {
  for (const step of plan.steps) {
    await this.executeStep(step, ctx, callbacks);
    if (step.action === 'ai_review') {
      // 暂停等待审核
      return { status: 'paused', pausedAt: step.id };
    }
  }
  return { status: 'completed', outputs: ctx.outputs };
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

### AICreatorInput 输入处理
```typescript
// apps/web/app/page.tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    localStorage.setItem('pending_workflow_desc', JSON.stringify({
      description: description.trim(),
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24小时
    }));
    router.push('/auth/login');
  }
};
```

---

## 14. 项目一句话总结

AgentOps Studio 是一个功能完整的 AI 自动化运营中台，具备 AI 工作流智能创建/解读、Workflow Builder 可视化编排、真实 AI Provider 集成、MinIO 文件存储、JWT 认证、节点执行追踪、审核流程和 WebSocket 实时推送等能力，用于展示全栈开发与 AI 应用集成的综合实力。
