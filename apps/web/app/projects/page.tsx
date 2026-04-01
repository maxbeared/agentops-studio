'use client';

import { useQuery } from '@tanstack/react-query';
import { Folder, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { AuthCheck } from '../../components/auth-check';
import { PageHeader, Card, Button, EmptyState, RevealSection } from '../../components/ui';
import { api } from '../../lib/api';

export default function ProjectsPage() {
  const { t } = useTranslation();

  const { data: projects = [], isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.projects.list(),
  });

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

          <RevealSection delay={100}>
            <Card className="p-6">
              {projects.length === 0 && !error ? (
                <EmptyState
                  icon={<Folder className="h-10 w-10 text-zinc-600" />}
                  title={t('projects.noProjects')}
                  description={t('projects.createProject')}
                />
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-xl border-2 border-zinc-600/80 bg-zinc-950/70 p-4 transition-all hover:border-cyan-500/50"
                    >
                      <div>
                        <h3 className="font-medium text-zinc-100">{project.name}</h3>
                        <p className="mt-1 text-base text-zinc-400">{project.description || t('projects.noDescription')}</p>
                      </div>
                      <div className="flex items-center gap-2 text-base text-zinc-500">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {new Date(project.createdAt).toLocaleDateString()}
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