'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { RefreshCw, Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../../contexts/locale-context';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    waiting_review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-base ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

function NodeStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    waiting_review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    skipped: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-base ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-400" />;
    case 'running':
    case 'pending':
      return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />;
    case 'waiting_review':
      return <AlertTriangle className="h-5 w-5 text-purple-400" />;
    default:
      return <Clock className="h-5 w-5 text-slate-400" />;
  }
}

export default function RunDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const runId = params.id as string;

  const [run, setRun] = useState<any>(null);
  const [nodeRuns, setNodeRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRun = useCallback(async () => {
    try {
      const [runData, nodeData] = await Promise.all([
        api.runs.get(runId),
        api.runs.getNodes(runId),
      ]);
      setRun(runData);
      setNodeRuns(nodeData?.nodes || []);
    } catch (err) {
      console.error('Failed to load run:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [runId]);

  useEffect(() => {
    loadRun();
  }, [loadRun]);

  useEffect(() => {
    if (run?.status === 'running' || run?.status === 'pending' || run?.status === 'waiting_review') {
      const interval = setInterval(() => {
        setRefreshing(true);
        loadRun();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [run?.status, loadRun]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        </div>
      </main>
    );
  }

  if (!run) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold">{t('runs.runDetail.notFound')}</h1>
          <Link href="/runs" className="mt-4 text-blue-400 hover:underline">
            {t('runs.runDetail.backToRuns')}
          </Link>
        </div>
      </main>
    );
  }

  const startedAt = run.startedAt ? new Date(run.startedAt) : null;
  const finishedAt = run.finishedAt ? new Date(run.finishedAt) : null;
  const duration = startedAt && finishedAt
    ? Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000)
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/runs" className="text-base text-slate-400 hover:text-white mb-4 inline-block">
              ← {t('runs.runDetail.backToRuns')}
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <StatusIcon status={run.status} />
              {t('runs.runDetail.title')}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => { setRefreshing(true); loadRun(); }}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-base text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('runs.runDetail.refresh')}
          </button>
        </header>

        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-slate-800 bg-slate-900/80 p-6 shadow-lg">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-base text-slate-400">{t('runs.runId')}</div>
                <div className="font-mono text-base text-slate-300">{run.id}</div>
              </div>
              <div>
                <div className="text-base text-slate-400">{t('runs.status')}</div>
                <div className="mt-1"><StatusBadge status={run.status} /></div>
              </div>
              <div>
                <div className="text-base text-slate-400">{t('runs.runDetail.triggerType')}</div>
                <div className="text-slate-300 capitalize">{run.triggerType}</div>
              </div>
              <div>
                <div className="text-base text-slate-400">{t('runs.duration')}</div>
                <div className="text-slate-300">{duration !== null ? `${duration}s` : '-'}</div>
              </div>
              <div>
                <div className="text-base text-slate-400">{t('runs.started')}</div>
                <div className="text-slate-300">{startedAt ? startedAt.toLocaleString() : '-'}</div>
              </div>
              <div>
                <div className="text-base text-slate-400">{t('runs.runDetail.finished')}</div>
                <div className="text-slate-300">{finishedAt ? finishedAt.toLocaleString() : '-'}</div>
              </div>
              {(run.totalTokens > 0 || run.totalCost > 0) && (
                <>
                  <div>
                    <div className="text-base text-slate-400">{t('runs.runDetail.totalTokens')}</div>
                    <div className="text-slate-300">{run.totalTokens?.toLocaleString() || '-'}</div>
                  </div>
                  <div>
                    <div className="text-base text-slate-400">{t('runs.runDetail.totalCost')}</div>
                    <div className="text-slate-300">${run.totalCost?.toFixed(6) || '-'}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {run.errorMessage && (
            <div className="rounded-2xl border-2 border-red-800/50 bg-red-900/20 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-red-400">{t('runs.runDetail.error')}</h2>
              <p className="mt-2 text-base text-red-300">{run.errorMessage}</p>
            </div>
          )}

          {run.outputPayload && Object.keys(run.outputPayload).length > 0 && (
            <div className="rounded-2xl border-2 border-slate-800 bg-slate-900/80 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-white">{t('runs.runDetail.output')}</h2>
              <pre className="mt-3 overflow-x-auto text-base text-slate-300">
                {JSON.stringify(run.outputPayload, null, 2)}
              </pre>
            </div>
          )}

          <div className="rounded-2xl border-2 border-slate-800 bg-slate-900/80 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white">{t('runs.runDetail.nodeExecutions')}</h2>
            <div className="mt-4 space-y-3">
              {nodeRuns.length === 0 ? (
                <p className="text-base text-slate-400">{t('runs.runDetail.noNodeExecutions')}</p>
              ) : (
                nodeRuns.map((node: any, index: number) => (
                  <div key={node.id || `node-${index}`} className="rounded-xl border-2 border-slate-700 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-white">{node.nodeKey}</span>
                        <span className="ml-2 text-base text-slate-500">({node.nodeType})</span>
                      </div>
                      <NodeStatusBadge status={node.status} />
                    </div>
                    {node.durationMs && (
                      <div className="mt-2 text-base text-slate-500">
                        {t('runs.runDetail.durationMs')}: {node.durationMs}ms
                      </div>
                    )}
                    {node.tokenUsageInput !== undefined && node.tokenUsageInput > 0 && (
                      <div className="mt-1 text-base text-slate-500">
                        {t('runs.runDetail.tokensInOut')}: {node.tokenUsageInput} in / {node.tokenUsageOutput} out
                      </div>
                    )}
                    {node.cost > 0 && (
                      <div className="mt-1 text-base text-slate-500">
                        {t('runs.runDetail.cost')}: ${node.cost}
                      </div>
                    )}
                    {node.outputPayload && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-base text-slate-500">{t('runs.runDetail.viewOutput')}</summary>
                        <pre className="mt-2 overflow-x-auto text-base text-slate-400 bg-slate-900/50 p-2 rounded">
                          {JSON.stringify(node.outputPayload, null, 2)}
                        </pre>
                      </details>
                    )}
                    {node.errorMessage && (
                      <p className="mt-2 text-base text-red-400">{node.errorMessage}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
