'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Link from 'next/link';
import { Activity, CheckCircle, Clock, DollarSign, FileText, GitBranch, Play, User, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardStats {
  totalRuns: number;
  successRate: number;
  totalTokens: number;
  totalCost: number;
  pendingReviews: number;
  recentRuns: Array<{
    id: string;
    workflowName: string;
    status: string;
    createdAt: string;
  }>;
  runsOverTime?: Array<{
    date: string;
    success: number;
    failed: number;
    total: number;
  }>;
}

function StatCard({ title, value, hint, icon: Icon, trend }: { title: string; value: string; hint: string; icon: React.ElementType; trend?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg transition-all hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="text-sm text-slate-400">{title}</div>
        <div className="rounded-lg bg-slate-800/50 p-2">
          <Icon className="h-4 w-4 text-indigo-400" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        {hint}
        {trend && (
          <span className="flex items-center gap-0.5 text-emerald-400">
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: { label: string; href: string } }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {action && (
          <Link href={action.href} className="text-sm text-indigo-400 hover:text-indigo-300">
            {action.label} →
          </Link>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

function QuickAction({ label, href, icon: Icon, color }: { label: string; href: string; icon: React.ElementType; color: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/70 ${color}`}
    >
      <div className="rounded-lg bg-slate-800/50 p-2.5">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="text-sm font-medium">{label}</div>
    </Link>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRuns: 0,
    successRate: 0,
    totalTokens: 0,
    totalCost: 0,
    pendingReviews: 0,
    recentRuns: [],
    runsOverTime: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.stats()
      .then((data) => {
        // Generate mock trend data for visualization
        const runsOverTime = [
          { date: 'Mon', success: 12, failed: 2, total: 14 },
          { date: 'Tue', success: 19, failed: 1, total: 20 },
          { date: 'Wed', success: 15, failed: 3, total: 18 },
          { date: 'Thu', success: 22, failed: 0, total: 22 },
          { date: 'Fri', success: 18, failed: 2, total: 20 },
          { date: 'Sat', success: 8, failed: 1, total: 9 },
          { date: 'Sun', success: 6, failed: 0, total: 6 },
        ];
        setStats({ ...data, runsOverTime });
      })
      .catch((e) => console.error('Failed to fetch dashboard stats:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-400" aria-hidden="true" />
            <span className="ml-4 text-lg text-slate-400">Loading dashboard...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header */}
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
              <Zap className="mr-1.5 h-3 w-3" aria-hidden="true" />
              AgentOps Studio
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              System Online
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            AI 自动化运营中台
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            展示 AI 应用工程师所需的全栈能力 — 工作流编排、知识检索、人工审核、成本分析。
          </p>
          {/* Quick Actions */}
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <QuickAction label="新建工作流" href="/workflows" icon={GitBranch} color="text-blue-400" />
            <QuickAction label="查看执行记录" href="/runs" icon={Activity} color="text-emerald-400" />
            <QuickAction label="知识库管理" href="/knowledge" icon={FileText} color="text-purple-400" />
            <QuickAction label="人工审核" href="/reviews" icon={User} color="text-pink-400" />
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Workflow Runs"
            value={stats.totalRuns.toString()}
            hint="Total executions"
            icon={Play}
            trend="+12%"
          />
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            hint="Last 7 days"
            icon={CheckCircle}
            trend="+3%"
          />
          <StatCard
            title="Token Usage"
            value={stats.totalTokens.toLocaleString()}
            hint="Total tokens consumed"
            icon={Zap}
          />
          <StatCard
            title="Total Cost"
            value={`$${stats.totalCost.toFixed(2)}`}
            hint="API costs"
            icon={DollarSign}
          />
        </section>

        {/* Charts and Lists */}
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <SectionCard title="执行趋势" action={{ label: 'View all', href: '/runs' }}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.runsOverTime || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="success"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSuccess)"
                    name="Success"
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFailed)"
                    name="Failed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Recent Runs" action={{ label: 'View all', href: '/runs' }}>
            {stats.recentRuns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-slate-600" aria-hidden="true" />
                <p className="mt-4 text-slate-400">No recent runs</p>
                <p className="mt-2 text-sm text-slate-500">Trigger a workflow to see execution history</p>
                <Link
                  href="/workflows"
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Go to Workflows
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentRuns.slice(0, 5).map((run) => (
                  <Link
                    key={run.id}
                    href={`/runs/${run.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-3 transition-colors hover:border-slate-700 hover:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        run.status === 'success' ? 'bg-emerald-400' :
                        run.status === 'failed' ? 'bg-red-400' :
                        run.status === 'running' ? 'bg-blue-400 animate-pulse' :
                        'bg-yellow-400'
                      }`} aria-hidden="true" />
                      <div>
                        <div className="text-sm font-medium text-white">{run.workflowName}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(run.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${
                      run.status === 'success' ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400' :
                      run.status === 'failed' ? 'border-red-500/30 bg-red-500/20 text-red-400' :
                      run.status === 'running' ? 'border-blue-500/30 bg-blue-500/20 text-blue-400' :
                      'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {run.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </section>

        {/* Features Grid */}
        <section className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="核心模块">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['知识库', '文档上传、切片、向量检索、版本管理', 'purple'],
                ['工作流', '节点编排、版本发布、可视化编辑', 'blue'],
                ['执行引擎', '异步执行、日志追踪、失败重试', 'emerald'],
                ['人工审核', '待审队列、修改回流、人机协作', 'pink'],
                ['投递集成', 'Webhook、Email、导出', 'cyan'],
                ['分析面板', '成功率、耗时、成本、活跃度', 'amber'],
              ].map(([title, desc, color]) => (
                <div key={title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-colors hover:border-slate-700">
                  <div className={`font-medium text-${color === 'purple' ? 'purple' : color === 'blue' ? 'blue' : color === 'emerald' ? 'emerald' : color === 'pink' ? 'pink' : color === 'cyan' ? 'cyan' : 'amber'}-400`}>
                    {title}
                  </div>
                  <div className="mt-2 text-sm text-slate-400">{desc}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Pending Reviews">
            {stats.pendingReviews > 0 ? (
              <div className="flex items-center gap-4 rounded-xl border border-pink-500/30 bg-pink-500/10 p-4">
                <div className="rounded-full bg-pink-500/20 p-3">
                  <User className="h-6 w-6 text-pink-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-semibold text-white">{stats.pendingReviews}</div>
                  <div className="text-sm text-slate-400">Tasks awaiting review</div>
                </div>
                <Link
                  href="/reviews"
                  className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
                >
                  Review Now
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-400" aria-hidden="true" />
                <p className="mt-4 text-slate-300">All caught up!</p>
                <p className="mt-2 text-sm text-slate-500">No pending review tasks</p>
              </div>
            )}
          </SectionCard>
        </section>
      </div>
    </main>
  );
}
