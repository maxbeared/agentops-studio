'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Folder, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { AuthCheck } from '../../components/auth-check';
import { PageHeader, Card, Button, EmptyState, RevealSection } from '../../components/ui';
import { api } from '../../lib/api';

export default function ProjectsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.projects.list(),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return api.projects.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      setFormData({ name: '', description: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string | null } }) => {
      return api.projects.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowEdit(null);
      setFormData({ name: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.projects.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
    } catch (err) {
      console.error('Create failed:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    try {
      await updateMutation.mutateAsync({ id: showEdit.id, data: formData });
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('projects.deleteConfirm'))) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const openEdit = (project: any) => {
    setShowEdit(project);
    setFormData({
      name: project.name,
      description: project.description || '',
    });
  };

  if (isLoading) {
    return (
      <main className="bg-zinc-950 px-6 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <span className="ml-3 text-zinc-400">{t('common.loading')}</span>
          </div>
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
              title={t('projects.title')}
              subtitle={t('projects.subtitle')}
              action={
                <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                  {t('projects.createProject')}
                </Button>
              }
            />
          </RevealSection>

          {error && (
            <Card className="mb-6 p-4 flex items-center gap-3 border-red-500/30 bg-red-500/10" glow glowColor="#ff4081">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-red-300 text-base flex-1">{(error as Error).message}</span>
              <Button variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            </Card>
          )}

          {(showCreate || showEdit) && (
            <RevealSection>
              <Card className="mb-6 p-6" glow glowColor="#00e5ff">
                <h2 className="mb-4 text-lg font-medium text-zinc-100">
                  {showEdit ? t('projects.editTitle') : t('projects.createTitle')}
                </h2>
                <form onSubmit={showEdit ? handleUpdate : handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-base text-zinc-400 mb-1">{t('projects.name')}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('projects.projectName')}
                      required
                      className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-base text-zinc-400 mb-1">{t('projects.description')}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('projects.descriptionOptional')}
                      rows={4}
                      className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending
                        ? t('projects.creating')
                        : updateMutation.isPending
                        ? t('projects.updating')
                        : showEdit
                        ? t('projects.update')
                        : t('projects.create')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowCreate(false);
                        setShowEdit(null);
                        setFormData({ name: '', description: '' });
                      }}
                    >
                      {t('projects.cancel')}
                    </Button>
                  </div>
                </form>
              </Card>
            </RevealSection>
          )}

          <RevealSection delay={100}>
            <Card className="p-6">
              {projects.length === 0 && !error ? (
                <EmptyState
                  icon={<Folder className="h-10 w-10 text-zinc-600" />}
                  title={t('projects.noProjects')}
                  description={t('projects.createProject')}
                  action={
                    <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                      {t('projects.createProject')}
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="group rounded-xl border-2 border-zinc-600/80 bg-zinc-950/70 p-4 transition-all hover:border-cyan-500/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-zinc-100">{project.name}</h3>
                          <p className="mt-1 text-base text-zinc-400">
                            {project.description || t('projects.noDescription')}
                          </p>
                          <p className="mt-2 text-base text-zinc-500">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 ml-4">
                          <button
                            type="button"
                            onClick={() => openEdit(project)}
                            className="rounded p-1.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-cyan-400"
                            title={t('common.edit')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(project.id)}
                            className="rounded p-1.5 text-red-400 transition-all hover:bg-red-500/20"
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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