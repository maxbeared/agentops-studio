function StatCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex items-start justify-between gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <div>
            <div className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
              AgentOps Studio
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              AI 自动化运营中台
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              一个用于展示 AI 应用工程能力的复杂全栈项目，包含知识库、工作流编排、异步任务、人工审核、执行日志和成本分析。
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <div>Stack</div>
            <div className="mt-2 font-mono text-xs text-slate-400">
              Next.js / React / TypeScript / Bun / Hono / PostgreSQL / Redis / BullMQ
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard title="Workflow Runs" value="128" hint="过去 7 天" />
          <StatCard title="Success Rate" value="94.5%" hint="自动化执行成功率" />
          <StatCard title="Token Cost" value="$18.24" hint="累计模型成本" />
          <StatCard title="Pending Reviews" value="6" hint="待人工审核任务" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <SectionCard title="核心模块">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['知识库', '文档上传、切片、向量检索、版本管理'],
                ['工作流', '节点编排、版本发布、可视化编辑'],
                ['执行引擎', '异步执行、日志追踪、失败重试'],
                ['人工审核', '待审队列、修改回流、人机协作'],
                ['投递集成', 'Webhook、Email、导出'],
                ['分析面板', '成功率、耗时、成本、活跃度'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="font-medium text-white">{title}</div>
                  <div className="mt-2 text-sm text-slate-400">{desc}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="示例工作流">
            <ol className="space-y-3 text-sm text-slate-300">
              <li>1. 上传市场周报与竞品资料</li>
              <li>2. 检索项目知识库内容</li>
              <li>3. 生成摘要与风险点</li>
              <li>4. 生成社媒内容与邮件简报</li>
              <li>5. 进入人工审核</li>
              <li>6. 审核通过后 Webhook 投递</li>
            </ol>
          </SectionCard>
        </section>
      </div>
    </main>
  );
}
