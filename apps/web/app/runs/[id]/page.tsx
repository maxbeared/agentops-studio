import { api } from '../../../lib/api';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    waiting_review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[status] || colors.pending}`}>
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
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [run, nodeRunsData] = await Promise.all([
    api.runs.get(id),
    api.runs.getNodes(id),
  ]);

  const nodeRuns = nodeRunsData?.nodes || [];
  const startedAt = run.startedAt ? new Date(run.startedAt) : null;
  const finishedAt = run.finishedAt ? new Date(run.finishedAt) : null;
  const duration = startedAt && finishedAt
    ? Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000)
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <a href="/runs" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">
            ← Back to Runs
          </a>
          <h1 className="text-3xl font-bold">Run Details</h1>
        </header>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-slate-400">Run ID</div>
                <div className="font-mono text-sm text-slate-300">{run.id}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Status</div>
                <div className="mt-1"><StatusBadge status={run.status} /></div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Trigger Type</div>
                <div className="text-slate-300">{run.triggerType}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Duration</div>
                <div className="text-slate-300">{duration !== null ? `${duration}s` : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Started</div>
                <div className="text-slate-300">{startedAt ? startedAt.toLocaleString() : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Finished</div>
                <div className="text-slate-300">{finishedAt ? finishedAt.toLocaleString() : '-'}</div>
              </div>
            </div>
          </div>

          {run.errorMessage && (
            <div className="rounded-2xl border border-red-800/50 bg-red-900/20 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-red-400">Error</h2>
              <p className="mt-2 text-sm text-red-300">{run.errorMessage}</p>
            </div>
          )}

          {run.outputPayload && Object.keys(run.outputPayload).length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-white">Output</h2>
              <pre className="mt-3 overflow-x-auto text-xs text-slate-300">
                {JSON.stringify(run.outputPayload, null, 2)}
              </pre>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white">Node Executions</h2>
            <div className="mt-4 space-y-3">
              {nodeRuns.length === 0 ? (
                <p className="text-sm text-slate-400">No node executions recorded</p>
              ) : (
                nodeRuns.map((node: any, index: number) => (
                  <div key={index} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-white">{node.nodeKey}</span>
                        <span className="ml-2 text-xs text-slate-500">({node.nodeType})</span>
                      </div>
                      <NodeStatusBadge status={node.status} />
                    </div>
                    {node.durationMs && (
                      <div className="mt-2 text-xs text-slate-500">
                        Duration: {node.durationMs}ms
                      </div>
                    )}
                    {node.outputPayload && (
                      <pre className="mt-2 overflow-x-auto text-xs text-slate-400">
                        {JSON.stringify(node.outputPayload, null, 2).slice(0, 200)}
                        {JSON.stringify(node.outputPayload).length > 200 ? '...' : ''}
                      </pre>
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