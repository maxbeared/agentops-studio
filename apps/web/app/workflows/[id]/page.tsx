'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { useWorkflowEditorStore, EditorNode, EditorEdge } from '../../../components/workflow';
import { WorkflowEditor, EditorToolbar, NodeConfigPanel } from '../../../components/workflow';

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
    type: 'default',
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

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const { nodes, edges, initWorkflow, isDirty, workflowName } = useWorkflowEditorStore();

  useEffect(() => {
    async function loadWorkflow() {
      try {
        const workflow = await api.workflows.get(workflowId);
        const editorNodes = convertApiToEditorNodes(workflow.definition?.nodes || []);
        const editorEdges = convertApiToEditorEdges(workflow.definition?.edges || []);
        initWorkflow(workflowId, workflow.name, editorNodes, editorEdges);
        setLoading(false);
      } catch (err) {
        setError('Failed to load workflow');
        setLoading(false);
      }
    }
    loadWorkflow();
  }, [workflowId, initWorkflow]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const definition = {
        nodes: convertEditorToApiNodes(nodes),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || undefined })),
      };
      await api.workflows.publish(workflowId, definition);
      useWorkflowEditorStore.setState({ isDirty: false });
    } catch (err) {
      setError('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  }, [workflowId, nodes, edges]);

  const handleRun = useCallback(async () => {
    if (isDirty) {
      setError('Please save the workflow before running');
      return;
    }
    setError(null);
    setIsRunning(true);
    try {
      const workflow = await api.workflows.get(workflowId);
      if (!workflow.latestVersionId) {
        setError('Publish the workflow first before running');
        return;
      }
      const run = await api.runs.create({
        workflowVersionId: workflow.latestVersionId,
        inputPayload: {},
      });
      router.push(`/runs/${run.id}`);
    } catch (err) {
      setError('Failed to run workflow');
    } finally {
      setIsRunning(false);
    }
  }, [workflowId, isDirty, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading workflow...</div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-lg font-medium text-white">{error}</h2>
          <Link href="/workflows" className="mt-4 text-blue-400 hover:underline">
            Back to workflows
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex-col bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/workflows"
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="font-semibold text-white">{workflowName}</h1>
            <p className="text-xs text-slate-500">Workflow Editor</p>
          </div>
        </div>
        <EditorToolbar onSave={handleSave} onRun={handleRun} isSaving={isSaving} canRun={!isDirty && !isRunning} />
      </header>

      {error && (
        <div className="absolute left-1/2 top-16 z-50 -translate-x-1/2 rounded bg-red-500/20 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex-1">
        <WorkflowEditor />
      </div>

      <NodeConfigPanel />
    </div>
  );
}
