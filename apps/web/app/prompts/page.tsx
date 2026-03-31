'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Edit2, Trash2, FileText, Copy, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { AuthCheck } from '../../components/auth-check';
import { PageHeader, Card, Button, LoadingState, EmptyState, RevealSection } from '../../components/ui';

export default function PromptsPage() {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: '',
  });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const data = await api.prompts.list();
      setPrompts(data);
    } catch (err) {
      console.error('Failed to fetch prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const projects = await api.projects.list();
      const projectId = projects[0]?.id;
      if (!projectId) {
        console.error('No project found');
        return;
      }
      const prompt = await api.prompts.create({
        projectId,
        ...formData,
      });
      setPrompts([prompt, ...prompts]);
      setShowCreate(false);
      setFormData({ name: '', description: '', template: '' });
    } catch (err) {
      console.error('Create failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    setSaving(true);
    try {
      const prompt = await api.prompts.update(showEdit.id, formData);
      setPrompts(prompts.map((p) => (p.id === showEdit.id ? prompt : p)));
      setShowEdit(null);
      setFormData({ name: '', description: '', template: '' });
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('prompts.deleteConfirm'))) return;
    try {
      await api.prompts.delete(id);
      setPrompts(prompts.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCopyTemplate = (id: string, template: string) => {
    navigator.clipboard.writeText(template);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEdit = (prompt: any) => {
    setShowEdit(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      template: prompt.template,
    });
  };

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
              title={t('prompts.title')}
              subtitle={t('prompts.subtitle')}
              action={
                <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                  {t('prompts.newTemplate')}
                </Button>
              }
            />
          </RevealSection>

          {(showCreate || showEdit) && (
            <RevealSection>
              <Card className="mb-6 p-6" glow glowColor="#00e5ff">
                <h2 className="mb-4 text-lg font-medium text-zinc-100">
                  {showEdit ? t('prompts.editTemplate') : t('prompts.createTemplate')}
                </h2>
                <form onSubmit={showEdit ? handleUpdate : handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-base text-zinc-400 mb-1">{t('prompts.name')}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('prompts.namePlaceholder')}
                      required
                      className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-base text-zinc-400 mb-1">{t('prompts.description')}</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('prompts.descriptionPlaceholder')}
                      className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-base text-zinc-400 mb-1">{t('prompts.template')}</label>
                    <textarea
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      placeholder={t('prompts.templatePlaceholder')}
                      rows={8}
                      required
                      className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 font-mono text-base resize-none focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <p className="mt-1 text-base text-zinc-500">{t('prompts.templateVariables')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" loading={saving}>
                      {saving ? t('prompts.saving') : showEdit ? t('prompts.update') : t('prompts.create')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowCreate(false);
                        setShowEdit(null);
                        setFormData({ name: '', description: '', template: '' });
                      }}
                    >
                      {t('prompts.cancel')}
                    </Button>
                  </div>
                </form>
              </Card>
            </RevealSection>
          )}

          <RevealSection delay={100}>
            <Card className="p-6">
              {prompts.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-10 w-10 text-zinc-600" />}
                  title={t('prompts.noTemplates')}
                  description={t('prompts.createTemplates')}
                />
              ) : (
                <div className="space-y-4">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="group rounded-xl border-2 border-zinc-600/80 bg-zinc-950/70 p-4 transition-all hover:border-cyan-500/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-zinc-100">{prompt.name}</h3>
                            <span className="text-base text-zinc-500">v{prompt.version}</span>
                          </div>
                          {prompt.description && (
                            <p className="mt-1 text-base text-zinc-400">{prompt.description}</p>
                          )}
                          <div className="mt-3 rounded bg-zinc-900/80 p-3">
                            <pre className="text-base text-zinc-400 whitespace-pre-wrap font-mono">
                              {prompt.template.slice(0, 200)}
                              {prompt.template.length > 200 ? '...' : ''}
                            </pre>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 ml-4">
                          <button
                            type="button"
                            onClick={() => handleCopyTemplate(prompt.id, prompt.template)}
                            className="rounded p-1.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-cyan-400"
                            title={t('prompts.copyTemplate')}
                          >
                            {copiedId === prompt.id ? (
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(prompt)}
                            className="rounded p-1.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-cyan-400"
                            title={t('common.edit')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prompt.id)}
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