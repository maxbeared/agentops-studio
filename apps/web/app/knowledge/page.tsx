'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Link as LinkIcon, RefreshCw, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { AuthCheck } from '../../components/auth-check';
import { PageHeader, Card, Button, StatusBadge, EmptyState, RevealSection } from '../../components/ui';
import { api } from '../../lib/api';

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
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['knowledge'],
    queryFn: () => api.knowledge.list(),
  });

  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, title, projectId }: { file: File; title: string; projectId: string }) => {
      return api.knowledge.upload(file, projectId, title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setShowUpload(false);
      setUploadTitle('');
      setSelectedFile(null);
    },
  });

  const processMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.knowledge.process(id);
    },
    onMutate: (id) => {
      setProcessingIds((prev) => [...prev, id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
    onSettled: (_, __, id) => {
      setProcessingIds((prev) => prev.filter(pid => pid !== id));
    },
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadTitle.trim()) return;

    setUploadError('');

    try {
      const projects = await queryClient.fetchQuery({ queryKey: ['projects'], queryFn: () => api.projects.list() });
      const projectId = projects[0]?.id;
      if (!projectId) {
        setUploadError(t('knowledge.noProject'));
        return;
      }

      const doc = await uploadMutation.mutateAsync({ file: selectedFile, title: uploadTitle, projectId });
      await processMutation.mutateAsync(doc.id);
    } catch (err) {
      setUploadError(t('knowledge.uploadFailed'));
    }
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
                    <Button type="submit" variant="primary" loading={uploadMutation.isPending}>
                      {uploadMutation.isPending ? t('knowledge.uploading') : t('knowledge.upload')}
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
                            onClick={() => processMutation.mutate(doc.id)}
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