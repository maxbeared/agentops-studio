'use client';

import { useCallback } from 'react';
import { useWorkflowEditorStore } from './editor-store';
import { Play, Save, Undo2, Redo2 } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { Button } from '../ui';

const nodeTypes = [
  { type: 'llm', color: 'border-blue-500 text-blue-400', dot: 'bg-blue-500' },
  { type: 'retrieval', color: 'border-purple-500 text-purple-400', dot: 'bg-purple-500' },
  { type: 'condition', color: 'border-amber-500 text-amber-400', dot: 'bg-amber-500' },
  { type: 'review', color: 'border-pink-500 text-pink-400', dot: 'bg-pink-500' },
  { type: 'webhook', color: 'border-cyan-500 text-cyan-400', dot: 'bg-cyan-500' },
  { type: 'output', color: 'border-zinc-500 text-zinc-400', dot: 'bg-zinc-500' },
  { type: 'input', color: 'border-teal-500 text-teal-400', dot: 'bg-teal-500' },
  { type: 'text', color: 'border-orange-500 text-orange-400', dot: 'bg-orange-500' },
  { type: 'loop', color: 'border-green-500 text-green-400', dot: 'bg-green-500' },
  { type: 'delay', color: 'border-yellow-500 text-yellow-400', dot: 'bg-yellow-500' },
  { type: 'transform', color: 'border-indigo-500 text-indigo-400', dot: 'bg-indigo-500' },
  { type: 'code', color: 'border-red-500 text-red-400', dot: 'bg-red-500' },
  { type: 'merge', color: 'border-violet-500 text-violet-400', dot: 'bg-violet-500' },
  { type: 'errorHandler', color: 'border-rose-500 text-rose-400', dot: 'bg-rose-500' },
];

const nodeLabels: Record<string, string> = {
  llm: 'editor.nodes.llm',
  retrieval: 'editor.nodes.retrieval',
  condition: 'editor.nodes.condition',
  review: 'editor.nodes.review',
  webhook: 'editor.nodes.webhook',
  output: 'editor.nodes.output',
  input: 'editor.nodes.input',
  text: 'editor.nodes.text',
  loop: 'editor.nodes.loop',
  delay: 'editor.nodes.delay',
  transform: 'editor.nodes.transform',
  code: 'editor.nodes.code',
  merge: 'editor.nodes.merge',
  errorHandler: 'editor.nodes.errorHandler',
};

export function NodeToolbar() {
  const { t } = useTranslation();
  const addNode = useWorkflowEditorStore((state) => state.addNode);
  const pushHistory = useWorkflowEditorStore((state) => state.pushHistory);

  const handleDragStart = useCallback((e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleAddNode = useCallback((type: string) => {
    const state = useWorkflowEditorStore.getState();
    const count = state.nodes.length;
    const x = 250 + (count % 5) * 40;
    const y = 150 + count * 80;
    const translatedLabel = t(nodeLabels[type]) || type;
    pushHistory();
    addNode(type, { x, y }, translatedLabel);
  }, [addNode, pushHistory, t]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-zinc-400 mr-2 font-medium">{t('editor.toolbar.addNode')}:</span>
      {nodeTypes.map(({ type, color, dot }) => (
        <button
          key={type}
          draggable
          onDragStart={(e) => handleDragStart(e, type)}
          onClick={() => handleAddNode(type)}
          className={`flex items-center gap-2 rounded border-2 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-800 ${color}`}
        >
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          {t(nodeLabels[type])}
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
  const { workflowName, isDirty, resetEditor, undo, redo, canUndo, canRedo } = useWorkflowEditorStore();

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
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          icon={<Undo2 className="h-4 w-4" />}
          aria-label="Undo (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          icon={<Redo2 className="h-4 w-4" />}
          aria-label="Redo (Ctrl+Y)"
          title="Redo (Ctrl+Y)"
        />
        <div className="h-4 w-px bg-zinc-700" />
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