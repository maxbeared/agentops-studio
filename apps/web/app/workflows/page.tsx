'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { Plus, Edit2, Play, Clock, Loader2, GitBranch } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { AuthCheck } from '../../components/auth-check';
import { PageHeader, Card, Button, StatusBadge, LoadingState, EmptyState, RevealSection } from '../../components/ui';

export default function WorkflowsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    api.workflows.list().then((data) => {
      setWorkflows(data);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load workflows:', err);
      setError(t('workflows.loadFailed'));
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const project = await api.projects.list().then(p => p[0]);
      if (!project) {
        setError(t('workflows.createProjectFirst'));
        return;
      }
      const workflow = await api.workflows.create({
        projectId: project.id,
        name: newName,
        description: newDesc,
      });
      setWorkflows((prev) => [...prev, workflow]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      console.error('Failed to create workflow:', err);
      setError(t('workflows.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleRun = useCallback(async (workflowId: string) => {
    setRunningId(workflowId);
    setRunError(null);
    try {
      const workflow = await api.workflows.get(workflowId);
      if (!workflow.latestVersionId) {
        setRunError(t('workflows.publishFirst'));
        return;
      }
      const run = await api.runs.create({
        workflowVersionId: workflow.latestVersionId,
        inputPayload: {},
      });
      router.push(`/runs/${run.id}`);
    } catch (err) {
      console.error('Failed to run workflow:', err);
      setRunError(t('workflows.runFailed'));
    } finally {
      setRunningId(null);
    }
  }, [router]);

  if (loading) {
    return (
      <main className="bg-zinc-950 px-6 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <LoadingState message={t('common.loading')} />
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
              title={t('workflows.title')}
              subtitle={t('workflows.subtitle')}
              action={
                <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                  {t('workflows.newWorkflow')}
                </Button>
              }
            />
          </RevealSection>

          {(error || runError) && (
            <Card className="mb-6 p-4 border-red-500/30 bg-red-500/10" glow glowColor="#ff4081">
              <span className="text-base text-red-400">{error || runError}</span>
            </Card>
          )}

          {showCreate && (
            <RevealSection>
              <Card className="mb-6 p-6" glow glowColor="#00e5ff">
                <h2 className="mb-4 text-lg font-medium text-zinc-100">{t('workflows.createTitle')}</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-base text-zinc-400 mb-1">{t('workflows.name')}</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="My Workflow"
                      className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base text-zinc-400 mb-1">{t('workflows.descriptionOptional')}</label>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="What does this workflow do?"
                      className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" loading={creating}>
                      {creating ? t('workflows.creating') : t('workflows.create')}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                      {t('workflows.cancel')}
                    </Button>
                  </div>
                </form>
              </Card>
            </RevealSection>
          )}

          <RevealSection delay={100}>
            <Card className="p-6">
              {workflows.length === 0 ? (
                <EmptyState
                  icon={<GitBranch className="h-10 w-10 text-zinc-600" />}
                  title={t('workflows.noWorkflows')}
                  description={t('workflows.createFirst')}
                />
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="group flex items-center justify-between rounded-xl border-2 border-zinc-600/80 bg-zinc-950/70 p-4 transition-all hover:border-cyan-500/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Link href={`/workflows/${workflow.id}`} className="font-medium text-zinc-100 transition-colors hover:text-cyan-400">
                            {workflow.name}
                          </Link>
                          <StatusBadge
                            status={t(`editor.status.${workflow.status}`)}
                            variant={workflow.status === 'published' ? 'success' : workflow.status === 'draft' ? 'default' : 'warning'}
                          />
                        </div>
                        <p className="mt-1 text-base text-zinc-400">{workflow.description || t('workflows.noDescription')}</p>
                        <div className="mt-2 flex items-center gap-4 text-base text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(workflow.createdAt).toLocaleDateString()}
                          </span>
                          {workflow.latestVersion && (
                            <span>{t('workflows.version')} {workflow.latestVersion}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link
                          href={`/workflows/${workflow.id}`}
                          className="flex items-center gap-1.5 rounded bg-cyan-500/10 px-3 py-1.5 text-base text-cyan-400 transition-all hover:bg-cyan-500/20 border-2 border-cyan-500/30"
                        >
                          <Edit2 className="h-3 w-3" />
                          {t('workflows.edit')}
                        </Link>
                        {workflow.status === 'published' && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={runningId === workflow.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                            onClick={() => handleRun(workflow.id)}
                            disabled={runningId === workflow.id}
                          >
                            {t('workflows.run')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </RevealSection>
        </div>
      </main>
    </AuthCheck>
  );
}