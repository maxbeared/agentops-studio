'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Edit2, Trash2, FileText, Copy, CheckCircle } from 'lucide-react';

export default function PromptsPage() {
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
    if (!confirm('Delete this prompt template?')) return;
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
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Prompt Templates</h1>
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
            <h1 className="text-3xl font-bold">Prompt Templates</h1>
            <p className="mt-2 text-slate-400">Create and manage reusable prompt templates</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </header>

        {(showCreate || showEdit) && (
          <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-medium">{showEdit ? 'Edit Template' : 'Create Template'}</h2>
            <form onSubmit={showEdit ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer Support Response"
                  required
                  className="w-full rounded bg-slate-800 border border-slate-700 px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Template for responding to customer inquiries"
                  className="w-full rounded bg-slate-800 border border-slate-700 px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Template</label>
                <textarea
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  placeholder="You are a helpful customer support agent. Respond to the following inquiry:&#10;&#10;{{user_input}}"
                  rows={8}
                  required
                  className="w-full rounded bg-slate-800 border border-slate-700 px-4 py-2 text-white font-mono text-sm resize-none"
                />
                <p className="mt-1 text-xs text-slate-500">Use {"{{variable}}"} for template variables</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : showEdit ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setShowEdit(null);
                    setFormData({ name: '', description: '', template: '' });
                  }}
                  className="rounded bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {prompts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No prompt templates yet.</p>
              <p className="mt-2 text-sm text-slate-500">Create templates to use in your workflow nodes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="group rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{prompt.name}</h3>
                        <span className="text-xs text-slate-500">v{prompt.version}</span>
                      </div>
                      {prompt.description && (
                        <p className="mt-1 text-sm text-slate-400">{prompt.description}</p>
                      )}
                      <div className="mt-3 rounded bg-slate-900/80 p-3">
                        <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                          {prompt.template.slice(0, 200)}
                          {prompt.template.length > 200 ? '...' : ''}
                        </pre>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 ml-4">
                      <button
                        onClick={() => handleCopyTemplate(prompt.id, prompt.template)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                        title="Copy template"
                      >
                        {copiedId === prompt.id ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(prompt)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="rounded p-1.5 text-red-400 hover:bg-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
