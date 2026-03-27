'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Upload, FileText, Link as LinkIcon, RefreshCw, CheckCircle } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    uploaded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ready: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[status] || colors.uploaded}`}>
      {status}
    </span>
  );
}

function SourceTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    file: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    url: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    text: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[type] || colors.file}`}>
      {type}
    </span>
  );
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await api.knowledge.list();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadTitle.trim()) return;

    setUploading(true);
    setUploadError('');

    try {
      const projects = await api.projects.list();
      const projectId = projects[0]?.id;
      if (!projectId) {
        setUploadError('No project found');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('projectId', projectId);
      formData.append('title', uploadTitle);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/knowledge/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (json.data) {
        setDocuments([json.data, ...documents]);
        setShowUpload(false);
        setUploadTitle('');
        setSelectedFile(null);

        await processDocument(json.data.id);
      } else {
        setUploadError(json.error?.formErrors?.[0] || 'Upload failed');
      }
    } catch (err) {
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const processDocument = async (id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/knowledge/${id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
      await loadDocuments();
    } catch (err) {
      console.error('Process failed:', err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
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
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="mt-2 text-slate-400">Manage documents for RAG retrieval</p>
          </div>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        </header>

        {showUpload && (
          <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-medium">Upload Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Document title"
                  required
                  className="w-full rounded bg-slate-800 border border-slate-700 px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">File</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full rounded bg-slate-800 border border-slate-700 px-4 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white"
                />
              </div>
              {uploadError && (
                <p className="text-sm text-red-400">{uploadError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="rounded bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No documents uploaded yet.</p>
              <p className="mt-2 text-sm text-slate-500">Upload documents to enable RAG retrieval in your workflows.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-slate-800 p-2.5">
                      {doc.sourceType === 'file' ? (
                        <FileText className="h-5 w-5 text-slate-400" />
                      ) : (
                        <LinkIcon className="h-5 w-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{doc.title}</h3>
                        <SourceTypeBadge type={doc.sourceType} />
                        <StatusBadge status={doc.status} />
                        {processingIds.has(doc.id) && (
                          <RefreshCw className="h-4 w-4 animate-spin text-yellow-400" />
                        )}
                        {doc.status === 'ready' && (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                      <div className="mt-1 flex gap-4 text-sm text-slate-500">
                        {doc.mimeType && <span>{doc.mimeType}</span>}
                        {doc.sourceUrl && (
                          <span className="truncate max-w-xs">{doc.sourceUrl}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.status === 'uploaded' && !processingIds.has(doc.id) && (
                      <button
                        type="button"
                        onClick={() => processDocument(doc.id)}
                        className="flex items-center gap-1.5 rounded bg-yellow-600/20 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-600/30"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Process
                      </button>
                    )}
                    <span className="text-sm text-slate-500">
                      v{doc.version} · {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
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
