'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = () => {
    setLoading(true);
    setError(null);
    api.projects.list()
      .then(setProjects)
      .catch(() => setError('Failed to load projects. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Projects</h1>
          </header>
          <div className="flex items-center justify-center py-20" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" aria-hidden="true" />
            <span className="ml-3 text-slate-400">Loading projects...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-slate-400">Manage your AI workflow projects</p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-800/50 bg-red-900/20 p-4 flex items-center gap-3" role="alert">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-red-300 text-sm flex-1">{error}</span>
            <button
              onClick={loadProjects}
              className="flex items-center gap-1.5 rounded bg-red-600/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-600/50"
              aria-label="Retry loading projects"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {projects.length === 0 && !error ? (
            <p className="text-slate-400">No projects yet. Create your first project to get started.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div>
                    <h3 className="font-medium text-white">{project.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{project.description || 'No description'}</p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date(project.createdAt).toLocaleDateString()}
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