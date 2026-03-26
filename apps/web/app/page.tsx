import { api } from '../lib/api';
import Link from 'next/link';

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

export default async function HomePage() {
  let stats = {
    totalRuns: 0,
    successRate: 0,
    totalTokens: 0,
    totalCost: 0,
    pendingReviews: 0,
    recentRuns: [] as any[],
  };

  try {
    stats = await api.dashboard.stats();
  } catch (e) {
    console.error('Failed to fetch dashboard stats:', e);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <div className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
            AgentOps Studio
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            AI 自动化运营中台
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            一个用于展示 AI 应用工程能力的复杂全栈项目，包含知识库、工作流编排、异步任务、人工审核、执行日志和成本分析。
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard title="Workflow Runs" value={stats.totalRuns.toString()} hint="Total executions" />
          <StatCard title="Success Rate" value={`${stats.successRate}%`} hint="Success rate" />
          <StatCard title="Token Cost" value={`$${stats.totalCost.toFixed(2)}`} hint="Total model cost" />
          <StatCard title="Pending Reviews" value={stats.pendingReviews.toString()} hint="Awaiting human review" />
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

          <SectionCard title="Recent Runs">
            {stats.recentRuns.length === 0 ? (
              <p className="text-sm text-slate-400">No recent runs</p>
            ) : (
              <div className="space-y-3">
                {stats.recentRuns.map((run) => (
                  <Link
                    key={run.id}
                    href={`/runs/${run.id}`}
                    className="flex items-center justify-between text-sm hover:text-indigo-400"
                  >
                    <span className="text-slate-300">{run.workflowName}</span>
                    <span className="text-slate-500">{run.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </section>
      </div>
    </main>
  );
}