'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { AuthCheck } from '../../components/auth-check';
import { PageHeader, Card, Button, StatusBadge, LoadingState, EmptyState, RevealSection } from '../../components/ui';

function getStatusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
  };
  return map[status] || 'default';
}

export default function ReviewsPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.reviews.list();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId: string) => {
    setProcessingIds((prev) => [...prev, taskId]);
    try {
      await api.reviews.approve(taskId, comment || undefined);
      await loadTasks();
      setSelectedTask(null);
      setComment('');
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setProcessingIds((prev) => prev.filter(id => id !== taskId));
    }
  };

  const handleReject = async (taskId: string) => {
    setProcessingIds((prev) => [...prev, taskId]);
    try {
      await api.reviews.reject(taskId, comment || undefined);
      await loadTasks();
      setSelectedTask(null);
      setComment('');
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setProcessingIds((prev) => prev.filter(id => id !== taskId));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <LoadingState message={t('common.loading')} />
        </div>
      </main>
    );
  }

  return (
    <AuthCheck>
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <RevealSection>
            <PageHeader
              title={t('reviews.title')}
              subtitle={t('reviews.subtitle')}
            />
          </RevealSection>

          <RevealSection delay={100}>
            <Card className="p-6">
              {tasks.length === 0 ? (
                <EmptyState
                  icon={<Clock className="h-10 w-10 text-zinc-600" />}
                  title={t('reviews.noTasks')}
                  description={t('reviews.workflowApproval')}
                />
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border-2 border-zinc-600/80 bg-zinc-950/70 p-4 transition-all hover:border-cyan-500/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-zinc-100">{t('reviews.reviewTask')}</h3>
                          <StatusBadge status={t(`reviews.status.${task.status}`)} variant={getStatusVariant(task.status)} />
                        </div>
                        <div className="flex items-center gap-4">
                          {task.assignee && (
                            <div className="flex items-center gap-1.5 text-base text-zinc-500">
                              <User className="h-3 w-3" />
                              {task.assignee.name}
                            </div>
                          )}
                          <span className="text-base text-zinc-500">
                            {new Date(task.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {task.nodeRun && (
                        <div className="mt-3 rounded-lg bg-zinc-900/50 p-3">
                          <div className="text-base text-zinc-500">
                            {t('reviews.node')}: {task.nodeRun.nodeKey} ({task.nodeRun.nodeType})
                          </div>
                          {task.nodeRun.outputPayload && (
                            <pre className="mt-2 overflow-x-auto text-base text-zinc-400">
                              {JSON.stringify(task.nodeRun.outputPayload, null, 2).slice(0, 500)}
                              {JSON.stringify(task.nodeRun.outputPayload).length > 500 ? '...' : ''}
                            </pre>
                          )}
                        </div>
                      )}

                      {task.reviewComment && (
                        <div className="mt-3 rounded-lg bg-zinc-800/50 p-3">
                          <div className="text-base text-zinc-500 mb-1">{t('reviews.reviewComment')}</div>
                          <p className="text-base text-zinc-300">{task.reviewComment}</p>
                        </div>
                      )}

                      {task.status === 'pending' && (
                        <div className="mt-4">
                          {selectedTask === task.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={t('reviews.addComment')}
                                rows={2}
                                className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-base text-white placeholder-zinc-500 resize-none focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="primary"
                                  icon={<CheckCircle className="h-4 w-4" />}
                                  onClick={() => handleApprove(task.id)}
                                  loading={processingIds.includes(task.id)}
                                >
                                  {t('reviews.approve')}
                                </Button>
                                <Button
                                  type="button"
                                  variant="danger"
                                  icon={<XCircle className="h-4 w-4" />}
                                  onClick={() => handleReject(task.id)}
                                  disabled={processingIds.includes(task.id)}
                                >
                                  {t('reviews.reject')}
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => {
                                    setSelectedTask(null);
                                    setComment('');
                                  }}
                                >
                                  {t('reviews.cancel')}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="primary"
                              onClick={() => setSelectedTask(task.id)}
                            >
                              {t('reviews.review')}
                            </Button>
                          )}
                        </div>
                      )}
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