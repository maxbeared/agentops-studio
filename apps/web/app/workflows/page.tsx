'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Plus, Edit2, Play, Clock } from 'lucide-react';

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

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useState(() => {
    api.workflows.list().then((data) => {
      setWorkflows(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const project = await api.projects.list().then(p => p[0]);
      if (project) {
        const workflow = await api.workflows.create({
          projectId: project.id,
          name: newName,
          description: newDesc,
        });
        setWorkflows([...workflows, workflow]);
        setShowCreate(false);
        setNewName('');
        setNewDesc('');
      }
    } catch (err) {
      console.error('Failed to create workflow');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Workflows</h1>
            <p className="mt-2 text-slate-400">Loading...</p>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workflows</h1>
            <p className="mt-2 text-slate-400">Create and manage AI workflow automations</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </button>
        </header>

        {showCreate && (
          <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-medium">Create New Workflow</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Workflow"
                  className="w-full rounded bg-slate-800 border border-slate-700 px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What does this workflow do?"
                  className="w-full rounded bg-slate-800 border border-slate-700 px-4 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {workflows.length === 0 ? (
            <p className="text-slate-400">No workflows yet. Create your first workflow to get started.</p>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-colors hover:border-slate-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link href={`/workflows/${workflow.id}`} className="font-medium text-white hover:text-blue-400">
                        {workflow.name}
                      </Link>
                      <StatusBadge status={workflow.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{workflow.description || 'No description'}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </span>
                      {workflow.latestVersion && (
                        <span>Version {workflow.latestVersion}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      href={`/workflows/${workflow.id}`}
                      className="flex items-center gap-1.5 rounded bg-blue-600/20 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-600/30"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Link>
                    {workflow.status === 'published' && (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded bg-emerald-600/20 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-600/30"
                      >
                        <Play className="h-3 w-3" />
                        Run
                      </button>
                    )}
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
