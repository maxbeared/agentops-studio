'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    waiting_review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[status] || colors.pending}`}>
      {label}
    </span>
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
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">{t('runs.title')}</h1>
          </header>
          <div className="flex items-center justify-center py-20" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" aria-hidden="true" />
            <span className="ml-3 text-slate-400">{t('runs.loading')}</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">{t('runs.title')}</h1>
          <p className="mt-2 text-slate-400">{t('runs.subtitle')}</p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-800/50 bg-red-900/20 p-4 flex items-center gap-3" role="alert">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-red-300 text-sm flex-1">{error}</span>
            <button
              onClick={loadRuns}
              className="flex items-center gap-1.5 rounded bg-red-600/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-600/50"
              aria-label={t('runs.retry')}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t('runs.retry')}
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {runs.length === 0 && !error ? (
            <p className="text-slate-400">{t('runs.noRuns')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
                    <th className="pb-3 font-medium">{t('runs.runId')}</th>
                    <th className="pb-3 font-medium">{t('runs.status')}</th>
                    <th className="pb-3 font-medium">{t('runs.trigger')}</th>
                    <th className="pb-3 font-medium">{t('runs.started')}</th>
                    <th className="pb-3 font-medium">{t('runs.duration')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {runs.map((run) => {
                    const startedAt = run.startedAt ? new Date(run.startedAt) : null;
                    const finishedAt = run.finishedAt ? new Date(run.finishedAt) : null;
                    const duration = startedAt && finishedAt
                      ? Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000)
                      : null;

                    return (
                      <tr key={run.id} className="text-sm hover:bg-slate-800/30 cursor-pointer">
                        <td className="py-3">
                          <Link href={`/runs/${run.id}`} className="font-mono text-xs text-indigo-400 hover:text-indigo-300">
                            {run.id.slice(0, 8)}...
                          </Link>
                        </td>
                        <td className="py-3"><StatusBadge status={run.status} label={getStatusLabel(t, run.status)} /></td>
                        <td className="py-3 text-slate-400">{run.triggerType}</td>
                        <td className="py-3 text-slate-400">
                          {startedAt ? startedAt.toLocaleString() : '-'}
                        </td>
                        <td className="py-3 text-slate-400">
                          {duration !== null ? `${duration}s` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}