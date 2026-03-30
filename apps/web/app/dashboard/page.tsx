'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { Activity, CheckCircle, Clock, DollarSign, FileText, GitBranch, Play, User, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../../contexts/locale-context';
import { AuthCheck } from '../../components/auth-check';
import { PageHeader, Card, Button, StatusBadge, LoadingState, EmptyState, RevealSection } from '../../components/ui';

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

function StatCard({ title, value, hint, icon: Icon, trend, color }: { title: string; value: string; hint: string; icon: React.ElementType; trend?: string; color: string }) {
  return (
    <div
      className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700/50"
      style={{ boxShadow: `0 0 30px ${color}08` }}
    >
      <div className="flex items-start justify-between">
        <div className="text-sm text-zinc-400">{title}</div>
        <div
          className="rounded-lg p-2"
          style={{ background: `${color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color }} aria-hidden="true" />
        </div>
      </div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
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
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        {action && (
          <Link href={action.href} className="text-sm transition-colors hover:text-cyan-400" style={{ color: '#00e5ff' }}>
            {action.label} →
          </Link>
        )}
      </div>
      <div>{children}</div>
    </Card>
  );
}

function QuickAction({ label, href, icon: Icon, color }: { label: string; href: string; icon: React.ElementType; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-950/70 p-4 transition-all hover:border-zinc-700/50"
      style={{ boxShadow: `0 0 20px ${color}08` }}
    >
      <div className="rounded-lg p-2.5" style={{ background: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} aria-hidden="true" />
      </div>
      <div className="text-sm font-medium text-zinc-300">{label}</div>
    </Link>
  );
}

function getStatusLabel(t: (key: string) => string, status: string): string {
  const labels: Record<string, string> = {
    pending: t('runs.pending'),
    running: t('runs.running'),
    success: t('runs.success'),
    failed: t('runs.failed'),
    waiting_review: t('runs.waitingReview'),
    cancelled: t('runs.cancelled'),
  };
  return labels[status] || status;
}

function getStatusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    success: 'success',
    failed: 'error',
    running: 'info',
    pending: 'warning',
    waiting_review: 'warning',
    cancelled: 'default',
  };
  return map[status] || 'default';
}

export default function DashboardPage() {
  const { t } = useTranslation();
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
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl flex flex-col gap-8">
          <LoadingState message={t('common.loading')} />
        </div>
      </main>
    );
  }

  return (
    <AuthCheck>
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl flex flex-col gap-8">
          {/* Header */}
          <PageHeader
            title={t('dashboard.title')}
            subtitle={t('dashboard.subtitle')}
            gradient
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('dashboard.systemOnline')}
              </span>
            </div>
          </PageHeader>

          {/* Quick Actions */}
          <div className="grid gap-3 md:grid-cols-4">
            <QuickAction label={t('dashboard.quickActions.newWorkflow')} href="/workflows" icon={GitBranch} color="#00e5ff" />
            <QuickAction label={t('dashboard.quickActions.viewRuns')} href="/runs" icon={Activity} color="#69f0ae" />
            <QuickAction label={t('dashboard.quickActions.knowledgeBase')} href="/knowledge" icon={FileText} color="#ea80fc" />
            <QuickAction label={t('dashboard.quickActions.humanReview')} href="/reviews" icon={User} color="#ff4081" />
          </div>

          {/* Stats Grid */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t('dashboard.workflowRuns')}
              value={stats.totalRuns.toString()}
              hint={t('dashboard.totalExecutions')}
              icon={Play}
              trend="+12%"
              color="#00e5ff"
            />
            <StatCard
              title={t('dashboard.successRate')}
              value={`${stats.successRate}%`}
              hint={t('dashboard.last7Days')}
              icon={CheckCircle}
              trend="+3%"
              color="#69f0ae"
            />
            <StatCard
              title={t('dashboard.tokenUsage')}
              value={stats.totalTokens.toLocaleString()}
              hint={t('dashboard.tokensConsumed')}
              icon={Zap}
              color="#ffca28"
            />
            <StatCard
              title={t('dashboard.totalCost')}
              value={`$${stats.totalCost.toFixed(2)}`}
              hint={t('dashboard.apiCosts')}
              icon={DollarSign}
              color="#ff4081"
            />
          </section>

          {/* Charts and Lists */}
          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <RevealSection>
              <SectionCard title={t('dashboard.executionTrend')} action={{ label: t('dashboard.viewAll'), href: '/runs' }}>
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
                        name={t('runs.chartLegend.success')}
                      />
                      <Area
                        type="monotone"
                        dataKey="failed"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorFailed)"
                        name={t('runs.chartLegend.failed')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </RevealSection>

            <RevealSection delay={100}>
              <SectionCard title={t('dashboard.recentRuns')} action={{ label: t('dashboard.viewAll'), href: '/runs' }}>
                {stats.recentRuns.length === 0 ? (
                  <EmptyState
                    icon={<Clock className="h-8 w-8 text-zinc-600" />}
                    title={t('dashboard.noRecentRuns')}
                    description={t('dashboard.triggerWorkflow')}
                    action={
                      <Link href="/workflows">
                        <Button variant="primary" size="sm">{t('dashboard.goToWorkflows')}</Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {stats.recentRuns.slice(0, 5).map((run) => (
                      <Link
                        key={run.id}
                        href={`/runs/${run.id}`}
                        className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-950/50 p-3 transition-all hover:border-zinc-700/50 hover:bg-zinc-900/50"
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
                            <div className="text-xs text-zinc-500">
                              {new Date(run.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={getStatusLabel(t, run.status)} variant={getStatusVariant(run.status)} />
                      </Link>
                    ))}
                  </div>
                )}
              </SectionCard>
            </RevealSection>
          </section>

          {/* Features Grid */}
          <section className="grid gap-6 lg:grid-cols-2">
            <RevealSection>
              <SectionCard title={t('dashboard.coreModules')}>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    [t('dashboard.features.knowledgeBase.title'), t('dashboard.features.knowledgeBase.desc'), '#ea80fc'],
                    [t('dashboard.features.workflow.title'), t('dashboard.features.workflow.desc'), '#00e5ff'],
                    [t('dashboard.features.executionEngine.title'), t('dashboard.features.executionEngine.desc'), '#69f0ae'],
                    [t('dashboard.features.humanReview.title'), t('dashboard.features.humanReview.desc'), '#ff4081'],
                    [t('dashboard.features.deliveryIntegration.title'), t('dashboard.features.deliveryIntegration.desc'), '#40c4ff'],
                    [t('dashboard.features.analytics.title'), t('dashboard.features.analytics.desc'), '#ffca28'],
                  ].map(([title, desc, color]) => (
                    <div
                      key={title as string}
                      className="rounded-xl border border-zinc-800/50 bg-zinc-950/70 p-4 transition-all hover:border-zinc-700/50"
                      style={{ boxShadow: `0 0 20px ${color}08` }}
                    >
                      <div className="font-medium" style={{ color }}>
                        {title}
                      </div>
                      <div className="mt-2 text-sm text-zinc-400">{desc}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </RevealSection>

            <RevealSection delay={100}>
              <SectionCard title={t('dashboard.pendingReviews')}>
                {stats.pendingReviews > 0 ? (
                  <div
                    className="flex items-center gap-4 rounded-xl border border-pink-500/30 bg-pink-500/10 p-4"
                    style={{ boxShadow: '0 0 30px rgba(255,64,129,0.1)' }}
                  >
                    <div className="rounded-full bg-pink-500/20 p-3">
                      <User className="h-6 w-6 text-pink-400" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-semibold text-white">{stats.pendingReviews}</div>
                      <div className="text-sm text-zinc-400">{t('dashboard.tasksAwaitingReview')}</div>
                    </div>
                    <Link href="/reviews">
                      <Button variant="primary" size="sm">{t('dashboard.quickActions.humanReview')}</Button>
                    </Link>
                  </div>
                ) : (
                  <EmptyState
                    icon={<CheckCircle className="h-8 w-8 text-emerald-400" />}
                    title={t('dashboard.allCaughtUp')}
                    description={t('dashboard.noPendingReviewTasks')}
                  />
                )}
              </SectionCard>
            </RevealSection>
          </section>
        </div>
      </main>
    </AuthCheck>
  );
}