'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

export default function ReviewsPage() {
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
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Human Review</h1>
            <p className="mt-2 text-slate-400">Loading...</p>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Human Review</h1>
          <p className="mt-2 text-slate-400">Review and approve AI-generated content</p>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No review tasks pending.</p>
              <p className="mt-2 text-sm text-slate-500">Tasks will appear here when workflows require human approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-white">Review Task</h3>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="flex items-center gap-4">
                      {task.assignee && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <User className="h-3 w-3" />
                          {task.assignee.name}
                        </div>
                      )}
                      <span className="text-sm text-slate-500">
                        {new Date(task.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {task.nodeRun && (
                    <div className="mt-3 rounded-lg bg-slate-900/50 p-3">
                      <div className="text-xs text-slate-500">
                        Node: {task.nodeRun.nodeKey} ({task.nodeRun.nodeType})
                      </div>
                      {task.nodeRun.outputPayload && (
                        <pre className="mt-2 overflow-x-auto text-xs text-slate-400">
                          {JSON.stringify(task.nodeRun.outputPayload, null, 2).slice(0, 500)}
                          {JSON.stringify(task.nodeRun.outputPayload).length > 500 ? '...' : ''}
                        </pre>
                      )}
                    </div>
                  )}

                  {task.reviewComment && (
                    <div className="mt-3 rounded-lg bg-slate-800/50 p-3">
                      <div className="text-xs text-slate-500 mb-1">Review Comment:</div>
                      <p className="text-sm text-slate-300">{task.reviewComment}</p>
                    </div>
                  )}

                  {task.status === 'pending' && (
                    <div className="mt-4">
                      {selectedTask === task.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add a comment (optional)..."
                            rows={2}
                            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(task.id)}
                              disabled={processingIds.includes(task.id)}
                              className="flex items-center gap-1.5 rounded bg-green-600 px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              {processingIds.includes(task.id) ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(task.id)}
                              disabled={processingIds.includes(task.id)}
                              className="flex items-center gap-1.5 rounded bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(null);
                                setComment('');
                              }}
                              className="rounded bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedTask(task.id)}
                          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
