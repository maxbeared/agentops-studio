'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Upload, FileText, Link as LinkIcon, RefreshCw, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { AuthCheck } from '../../components/auth-check';
import { PageHeader, Card, Button, StatusBadge, LoadingState, EmptyState, RevealSection } from '../../components/ui';

function getStatusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    ready: 'success',
    processing: 'warning',
    uploaded: 'info',
    failed: 'error',
  };
  return map[status] || 'default';
}

function getSourceTypeVariant(type: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    file: 'default',
    url: 'info',
    text: 'warning',
  };
  return map[type] || 'default';
}

export default function KnowledgePage() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [processingIds, setProcessingIds] = useState<string[]>([]);

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
        setUploadError(t('knowledge.noProject'));
        return;
      }

      const doc = await api.knowledge.upload(selectedFile, projectId, uploadTitle);
      setDocuments((prev) => [doc, ...prev]);
      setShowUpload(false);
      setUploadTitle('');
      setSelectedFile(null);

      await processDocument(doc.id);
    } catch (err) {
      setUploadError(t('knowledge.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const processDocument = async (id: string) => {
    setProcessingIds((prev) => [...prev, id]);
    try {
      await api.knowledge.process(id);
      await loadDocuments();
    } catch (err) {
      console.error('Process failed:', err);
    } finally {
      setProcessingIds((prev) => prev.filter(pid => pid !== id));
    }
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
              title={t('knowledge.title')}
              subtitle={t('knowledge.subtitle')}
              action={
                <Button variant="primary" icon={<Upload className="h-4 w-4" />} onClick={() => setShowUpload(true)}>
                  {t('knowledge.uploadDocument')}
                </Button>
              }
            />
          </RevealSection>

          {showUpload && (
            <RevealSection>
              <Card className="mb-6 p-6" glow glowColor="#00e5ff">
                <h2 className="mb-4 text-lg font-medium text-zinc-100">{t('knowledge.uploadTitle')}</h2>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="block text-base text-zinc-400 mb-1">{t('knowledge.titleLabel')}</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder={t('knowledge.documentTitle')}
                      required
                      className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-base text-zinc-400 mb-1">{t('knowledge.fileLabel')}</label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-base file:bg-cyan-500 file:text-zinc-950 file:font-medium"
                    />
                  </div>
                  {uploadError && (
                    <p className="text-base text-red-400">{uploadError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" loading={uploading}>
                      {uploading ? t('knowledge.uploading') : t('knowledge.upload')}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowUpload(false)}>
                      {t('knowledge.cancel')}
                    </Button>
                  </div>
                </form>
              </Card>
            </RevealSection>
          )}

          <RevealSection delay={100}>
            <Card className="p-6">
              {documents.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-10 w-10 text-zinc-600" />}
                  title={t('knowledge.noDocuments')}
                  description={t('knowledge.ragRetrieval')}
                />
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border-2 border-zinc-600/80 bg-zinc-950/70 p-4 transition-all hover:border-cyan-500/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-zinc-800/50 p-2.5">
                          {doc.sourceType === 'file' ? (
                            <FileText className="h-5 w-5 text-zinc-400" />
                          ) : (
                            <LinkIcon className="h-5 w-5 text-cyan-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-zinc-100">{doc.title}</h3>
                            <StatusBadge
                              status={t(`knowledge.source${doc.sourceType.charAt(0).toUpperCase() + doc.sourceType.slice(1)}`)}
                              variant={getSourceTypeVariant(doc.sourceType)}
                            />
                            <StatusBadge
                              status={t(`knowledge.status.${doc.status}`)}
                              variant={getStatusVariant(doc.status)}
                            />
                            {processingIds.includes(doc.id) && (
                              <RefreshCw className="h-4 w-4 animate-spin text-yellow-400" />
                            )}
                            {doc.status === 'ready' && (
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                            )}
                          </div>
                          <div className="mt-1 flex gap-4 text-base text-zinc-500">
                            {doc.mimeType && <span>{doc.mimeType}</span>}
                            {doc.sourceUrl && (
                              <span className="truncate max-w-xs">{doc.sourceUrl}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {doc.status === 'uploaded' && !processingIds.includes(doc.id) && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<RefreshCw className="h-3 w-3" />}
                            onClick={() => processDocument(doc.id)}
                          >
                            {t('knowledge.process')}
                          </Button>
                        )}
                        <span className="text-base text-zinc-500">
                          v{doc.version} · {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
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