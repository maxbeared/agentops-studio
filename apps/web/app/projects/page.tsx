import { api } from '../../lib/api';

export default async function ProjectsPage() {
  const projects = await api.projects.list();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-slate-400">Manage your AI workflow projects</p>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {projects.length === 0 ? (
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