'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { useWorkflowEditorStore, EditorNode, EditorEdge } from '../../../components/workflow';
import { WorkflowEditor, EditorToolbar } from '../../../components/workflow';
import { useTranslation } from '../../../contexts/locale-context';
import { AuthCheck } from '../../../components/auth-check';

function convertApiToEditorNodes(nodes: any[]): EditorNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: {
      label: n.name,
      type: n.type,
      config: n.config || {},
    },
  }));
}

function convertApiToEditorEdges(edges: any[]): EditorEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'deletable',
  }));
}

function convertEditorToApiNodes(nodes: EditorNode[]): any[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    name: n.data.label,
    config: n.data.config,
    position: n.position,
  }));
}

function WorkflowEditorContent() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const { nodes, edges, initWorkflow, isDirty, workflowName, validationResult } = useWorkflowEditorStore();

  // Store ref to track if we've loaded
  const hasLoadedRef = useRef(false);

  // Load workflow only once when workflowId changes
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    async function loadWorkflow() {
      try {
        const workflow = await api.workflows.get(workflowId);
        const editorNodes = convertApiToEditorNodes(workflow.definition?.nodes || []);
        const editorEdges = convertApiToEditorEdges(workflow.definition?.edges || []);
        initWorkflow(workflowId, workflow.name, editorNodes, editorEdges);
      } catch {
        setError('Failed to load workflow');
      } finally {
        setLoading(false);
      }
    }
    loadWorkflow();
  }, [workflowId, initWorkflow]);

  const handleSave = useCallback(async () => {
    // Check validation before saving
    if (validationResult && !validationResult.valid) {
      setError(t('editor.workflowEditor.validationFailed'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const definition = {
        nodes: convertEditorToApiNodes(nodes),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || undefined, targetHandle: e.targetHandle || undefined })),
      };
      await api.workflows.publish(workflowId, definition);
      useWorkflowEditorStore.getState().markSaved();
    } catch {
      setError(t('editor.workflowEditor.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [workflowId, nodes, edges, t, validationResult]);

  const handleRun = useCallback(async () => {
    if (isDirty) {
      setError(t('editor.workflowEditor.publishFirst'));
      return;
    }
    if (validationResult && !validationResult.valid) {
      setError(t('editor.workflowEditor.validationFailed'));
      return;
    }
    setError(null);
    setIsRunning(true);
    try {
      const workflow = await api.workflows.get(workflowId);
      if (!workflow.latestVersionId) {
        setError(t('editor.workflowEditor.publishFirst'));
        return;
      }
      const run = await api.runs.create({
        workflowVersionId: workflow.latestVersionId,
        inputPayload: {},
      });
      router.push(`/runs/${run.id}`);
    } catch {
      setError(t('editor.workflowEditor.runFailed'));
    } finally {
      setIsRunning(false);
    }
  }, [workflowId, isDirty, router, t, validationResult]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <span className="ml-3 text-zinc-400">{t('editor.workflowEditor.loading')}</span>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-lg font-medium text-white">{error}</h2>
          <Link href="/workflows" className="mt-4 inline-block text-cyan-400 hover:underline">
            {t('editor.workflowEditor.backToWorkflows')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col bg-zinc-950" style={{ height: 'calc(100vh - var(--navbar-height, 0px))' }}>
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/workflows"
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('editor.workflowEditor.back')}
          </Link>
          <div>
            <h1 className="font-semibold text-white">{workflowName}</h1>
            <p className="text-xs text-zinc-500">{t('editor.workflowEditor.title')}</p>
          </div>
        </div>
        <EditorToolbar onSave={handleSave} onRun={handleRun} isSaving={isSaving} canRun={!isDirty && !isRunning} />
      </header>

      {error && (
        <div className="absolute left-1/2 top-16 z-50 -translate-x-1/2 rounded bg-red-500/20 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <WorkflowEditor />
      </div>
    </div>
  );
}

export default function WorkflowEditorPage() {
  return (
    <AuthCheck>
      <WorkflowEditorContent />
    </AuthCheck>
  );
}