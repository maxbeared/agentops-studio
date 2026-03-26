import { api } from '../../lib/api';
import Link from 'next/link';

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

export default async function RunsPage() {
  const runs = await api.runs.list();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Workflow Runs</h1>
          <p className="mt-2 text-slate-400">View execution history and logs</p>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {runs.length === 0 ? (
            <p className="text-slate-400">No runs yet. Trigger a workflow to see execution history here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
                    <th className="pb-3 font-medium">Run ID</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Trigger</th>
                    <th className="pb-3 font-medium">Started</th>
                    <th className="pb-3 font-medium">Duration</th>
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
                        <td className="py-3"><StatusBadge status={run.status} /></td>
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