'use client';

import { useWorkflowEditorStore } from './editor-store';
import { Play, Save, Plus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const nodeTypes = [
  { type: 'start', label: 'Start', color: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
  { type: 'llm', label: 'LLM', color: 'bg-blue-500/20 border-blue-500 text-blue-400' },
  { type: 'retrieval', label: 'Retrieval', color: 'bg-purple-500/20 border-purple-500 text-purple-400' },
  { type: 'condition', label: 'Condition', color: 'bg-amber-500/20 border-amber-500 text-amber-400' },
  { type: 'review', label: 'Review', color: 'bg-pink-500/20 border-pink-500 text-pink-400' },
  { type: 'webhook', label: 'Webhook', color: 'bg-cyan-500/20 border-cyan-500 text-cyan-400' },
  { type: 'output', label: 'Output', color: 'bg-slate-500/20 border-slate-500 text-slate-400' },
];

export function NodeToolbar() {
  const { addNode, nodes } = useWorkflowEditorStore();

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAddNode = (type: string) => {
    const x = 250 + Math.random() * 100;
    const y = 100 + nodes.length * 100;
    addNode(type, { x, y });
  };

  return (
    <div className="flex items-center gap-2" role="toolbar" aria-label="Add workflow nodes">
      {nodeTypes.map(({ type, label, color }) => (
        <button
          key={type}
          draggable
          onDragStart={(e) => handleDragStart(e, type)}
          onClick={() => handleAddNode(type)}
          className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-80 ${color}`}
          aria-label={`Add ${label} node`}
          title={`Drag or click to add a ${label} node`}
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          {label}
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
  const { workflowName, isDirty, resetEditor } = useWorkflowEditorStore();

  return (
    <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/80 px-4 py-3" role="toolbar" aria-label="Workflow editor toolbar">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white" aria-label={`Workflow: ${workflowName}`}>{workflowName}</h1>
        {isDirty && (
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400" role="status" aria-live="polite">
            Unsaved changes
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={resetEditor}
          className="flex items-center gap-1.5 rounded bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
          aria-label="Reset workflow editor"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          aria-label={isSaving ? 'Saving workflow' : 'Save workflow'}
          aria-busy={isSaving}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        {onRun && (
          <button
            type="button"
            onClick={onRun}
            disabled={!canRun}
            className="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            aria-label="Run workflow"
            aria-disabled={!canRun}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Run
          </button>
        )}
      </div>
    </div>
  );
}
