import { api } from '../../lib/api';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    published: 'bg-green-500/20 text-green-400 border-green-500/30',
    archived: 'bg-slate-700/20 text-slate-500 border-slate-700/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
}

export default async function WorkflowsPage() {
  const workflows = await api.workflows.list();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="mt-2 text-slate-400">Create and manage AI workflow automations</p>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {workflows.length === 0 ? (
            <p className="text-slate-400">No workflows yet. Create your first workflow to get started.</p>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{workflow.name}</h3>
                      <StatusBadge status={workflow.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{workflow.description || 'No description'}</p>
                    {workflow.latestVersion && (
                      <p className="mt-1 text-xs text-slate-500">Version {workflow.latestVersion}</p>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}