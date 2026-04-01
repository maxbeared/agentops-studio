'use client';

import { useCallback } from 'react';
import { useWorkflowEditorStore } from './editor-store';
import { Play, Save, Plus } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { Button } from '../ui';

const nodeTypes = [
  { type: 'start', label: 'Start', color: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
  { type: 'llm', label: 'LLM', color: 'bg-blue-500/20 border-blue-500 text-blue-400' },
  { type: 'retrieval', label: 'Retrieval', color: 'bg-purple-500/20 border-purple-500 text-purple-400' },
  { type: 'condition', label: 'Condition', color: 'bg-amber-500/20 border-amber-500 text-amber-400' },
  { type: 'review', label: 'Review', color: 'bg-pink-500/20 border-pink-500 text-pink-400' },
  { type: 'webhook', label: 'Webhook', color: 'bg-cyan-500/20 border-cyan-500 text-cyan-400' },
  { type: 'output', label: 'Output', color: 'bg-zinc-500/20 border-zinc-500 text-zinc-400' },
];

export function NodeToolbar() {
  const { t } = useTranslation();
  const addNode = useWorkflowEditorStore((state) => state.addNode);

  const handleDragStart = useCallback((e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleAddNode = useCallback((type: string) => {
    // Get fresh state each time to avoid stale closures
    const state = useWorkflowEditorStore.getState();
    const count = state.nodes.length;
    const x = 250 + (count % 5) * 40;
    const y = 150 + count * 80;
    addNode(type, { x, y });
  }, [addNode]);

  const getNodeLabel = (type: string) => {
    const labels: Record<string, string> = {
      start: t('editor.nodes.start'),
      llm: t('editor.nodes.llm'),
      retrieval: t('editor.nodes.retrieval'),
      condition: t('editor.nodes.condition'),
      review: t('editor.nodes.review'),
      webhook: t('editor.nodes.webhook'),
      output: t('editor.nodes.output'),
    };
    return labels[type] || type;
  };

  return (
    <div className="flex items-center gap-2" role="toolbar" aria-label="Add workflow nodes">
      {nodeTypes.map(({ type, color }) => (
        <button
          key={type}
          draggable
          onDragStart={(e) => handleDragStart(e, type)}
          onClick={() => handleAddNode(type)}
          className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-80 ${color}`}
          aria-label={`Add ${getNodeLabel(type)} node`}
          title={`Drag or click to add a ${getNodeLabel(type)} node`}
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          {getNodeLabel(type)}
        </button>
      ))}
    </div>
  );
}

interface EditorToolbarProps {
  onSave: () => Promise<void>;
  onRun?: () => void;
  isSaving: boolean;
  canRun: boolean;
}

export function EditorToolbar({ onSave, onRun, isSaving, canRun }: EditorToolbarProps) {
  const { t } = useTranslation();
  const { workflowName, isDirty, resetEditor } = useWorkflowEditorStore();

  return (
    <div className="flex items-center gap-3">
      <h1 className="text-lg font-semibold text-white" aria-label={`Workflow: ${workflowName}`}>{workflowName}</h1>
      {isDirty && (
        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400" role="status" aria-live="polite">
          {t('editor.workflowEditor.unsavedChanges')}
        </span>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={resetEditor}
          aria-label="Reset workflow editor"
        >
          {t('editor.toolbar.reset')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          loading={isSaving}
          icon={<Save className="h-4 w-4" />}
          aria-label={isSaving ? 'Saving workflow' : 'Save workflow'}
          aria-busy={isSaving}
        >
          {t('editor.toolbar.save')}
        </Button>
        {onRun && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onRun}
            disabled={!canRun}
            icon={<Play className="h-4 w-4" />}
            aria-label="Run workflow"
            aria-disabled={!canRun}
          >
            {t('workflows.run')}
          </Button>
        )}
      </div>
    </div>
  );
}