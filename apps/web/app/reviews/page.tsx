import { api } from '../../lib/api';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

export default async function ReviewsPage() {
  let tasks: any[] = [];

  try {
    tasks = await api.reviews?.list ? await api.reviews.list() : [];
  } catch (e) {
    console.error('Failed to fetch review tasks:', e);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Human Review</h1>
          <p className="mt-2 text-slate-400">Review and approve AI-generated content</p>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No review tasks pending.</p>
              <p className="mt-2 text-sm text-slate-500">Tasks will appear here when workflows require human approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">Review Task</h3>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(task.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {task.nodeRun && (
                    <div className="mt-3 rounded-lg bg-slate-900/50 p-3">
                      <div className="text-xs text-slate-500">
                        Node: {task.nodeRun.nodeKey} ({task.nodeRun.nodeType})
                      </div>
                      {task.nodeRun.outputPayload && (
                        <pre className="mt-2 overflow-x-auto text-xs text-slate-400">
                          {JSON.stringify(task.nodeRun.outputPayload, null, 2).slice(0, 300)}
                          {JSON.stringify(task.nodeRun.outputPayload).length > 300 ? '...' : ''}
                        </pre>
                      )}
                    </div>
                  )}

                  {task.reviewComment && (
                    <div className="mt-3 text-sm text-slate-400">
                      <span className="text-slate-500">Comment:</span> {task.reviewComment}
                    </div>
                  )}

                  {task.assignee && (
                    <div className="mt-2 text-xs text-slate-500">
                      Assigned to: {task.assignee.name} ({task.assignee.email})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}