'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { Loader2, AlertCircle, RefreshCw, Clock, Play } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { AuthCheck } from '../../components/auth-check';
import { PageHeader, Card, Button, StatusBadge, LoadingState, EmptyState, RevealSection } from '../../components/ui';

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

export default function RunsPage() {
  const { t } = useTranslation();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.runs.list();
      setRuns(data);
    } catch {
      setError(t('runs.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  if (loading) {
    return (
      <main className="bg-zinc-950 px-6 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <LoadingState message={t('runs.loading')} />
        </div>
      </main>
    );
  }

  return (
    <AuthCheck>
      <main className="bg-zinc-950 px-6 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <RevealSection>
            <PageHeader
              title={t('runs.title')}
              subtitle={t('runs.subtitle')}
            />
          </RevealSection>

          {error && (
            <Card className="mb-6 p-4 flex items-center gap-3 border-red-500/30 bg-red-500/10" glow glowColor="#ff4081">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-red-300 text-base flex-1">{error}</span>
              <Button variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={loadRuns}>
                {t('runs.retry')}
              </Button>
            </Card>
          )}

          <RevealSection delay={100}>
            <Card className="p-6">
              {runs.length === 0 && !error ? (
                <EmptyState
                  icon={<Play className="h-10 w-10 text-zinc-600" />}
                  title={t('runs.noRuns')}
                  description={t('runs.subtitle')}
                  action={
                    <Link href="/workflows">
                      <Button variant="primary" size="sm">{t('workflows.title')}</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left text-base text-zinc-400">
                        <th className="pb-3 font-medium">{t('runs.runId')}</th>
                        <th className="pb-3 font-medium">{t('runs.status')}</th>
                        <th className="pb-3 font-medium">{t('runs.trigger')}</th>
                        <th className="pb-3 font-medium">{t('runs.started')}</th>
                        <th className="pb-3 font-medium">{t('runs.duration')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {runs.map((run) => {
                        const startedAt = run.startedAt ? new Date(run.startedAt) : null;
                        const finishedAt = run.finishedAt ? new Date(run.finishedAt) : null;
                        const duration = startedAt && finishedAt
                          ? Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000)
                          : null;

                        return (
                          <tr key={run.id} className="text-base hover:bg-zinc-800/30 cursor-pointer">
                            <td className="py-3">
                              <Link href={`/runs/${run.id}`} className="font-mono text-base transition-colors hover:text-cyan-400" style={{ color: '#00e5ff' }}>
                                {run.id.slice(0, 8)}...
                              </Link>
                            </td>
                            <td className="py-3">
                              <StatusBadge status={getStatusLabel(t, run.status)} variant={getStatusVariant(run.status)} />
                            </td>
                            <td className="py-3 text-zinc-400">{run.triggerType}</td>
                            <td className="py-3 text-zinc-400">
                              {startedAt ? startedAt.toLocaleString() : '-'}
                            </td>
                            <td className="py-3 text-zinc-400">
                              {duration !== null ? `${duration}s` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </RevealSection>
        </div>
      </main>
    </AuthCheck>
  );
}