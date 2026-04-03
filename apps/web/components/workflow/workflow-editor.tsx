'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node,
  type Edge,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowEditorStore, EditorNode, EditorEdge } from './editor-store';

// Override React Flow default node styling to prevent white backgrounds
const reactFlowOverrideStyles = `
.react-flow__node {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
.react-flow__node > div {
  background: transparent !important;
}
.react-flow__handle {
  background: #52525b !important;
}
.react-flow__edge-path {
  stroke: #52525b !important;
  stroke-width: 2 !important;
  transition: stroke 0.15s, stroke-width 0.15s !important;
}
.react-flow__edge:hover .react-flow__edge-path {
  stroke: #a1a1aa !important;
  stroke-width: 3 !important;
}
.react-flow__edge.selected .react-flow__edge-path {
  stroke: #22d3ee !important;
  stroke-width: 3 !important;
}
`;
import { nodeTypes } from './nodes';
import { NodeToolbar } from './toolbar';
import { NodeConfigPanel } from './node-config-panel';
import { useTranslation } from '../../contexts/locale-context';

export { validateWorkflow, formatValidationResult } from './validation';

const nodeColorMap: Record<string, string> = {
  start: '#10b981',
  llm: '#3b82f6',
  retrieval: '#a855f7',
  condition: '#f59e0b',
  review: '#ec4899',
  webhook: '#06b6d4',
  output: '#71717a',
  input: '#14b8a6',
  text: '#f97316',
  loop: '#22c55e',
  delay: '#eab308',
  transform: '#6366f1',
  code: '#ef4444',
  merge: '#8b5cf6',
  errorHandler: '#f43f5e',
};

function ValidationStatusBar() {
  const { t } = useTranslation();
  const validationResult = useWorkflowEditorStore((state) => state.validationResult);
  const [expanded, setExpanded] = useState(false);

  if (!validationResult || (validationResult.errors.length === 0 && validationResult.warnings.length === 0)) {
    return null;
  }

  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;

  return (
    <div className={`border-b border-zinc-800 ${hasErrors ? 'bg-red-500/5' : 'bg-amber-500/5'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className={`h-2 w-2 rounded-full ${hasErrors ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
        <span className={`text-sm ${hasErrors ? 'text-red-400' : 'text-amber-400'}`}>
          {hasErrors
            ? `${validationResult.errors.length} ${t('editor.validation.errors')}`
            : `${validationResult.warnings.length} ${t('editor.validation.warnings')}`}
        </span>
        <span className="text-xs text-zinc-500 ml-auto">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-2">
          {validationResult.errors.length > 0 && (
            <ul className="space-y-1 mb-2">
              {validationResult.errors.map((error, i) => (
                <li key={i} className="text-xs text-red-300 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  {t(`editor.validation.${error.id}`) || error.message}
                </li>
              ))}
            </ul>
          )}
          {validationResult.warnings.length > 0 && (
            <ul className="space-y-1">
              {validationResult.warnings.map((warning, i) => (
                <li key={i} className="text-xs text-amber-300 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {t(`editor.validation.${warning.id}`) || warning.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Custom edge component with inline delete button - bezier with horizontal flow
function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data,
}: EdgeProps) {
  // Calculate midpoint for label position
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Calculate horizontal distance for smooth bezier curve
  // For horizontal flow, control points should extend horizontally
  const dx = targetX - sourceX;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);

  // Create bezier path with horizontal tangent at source and target
  const path = `M${sourceX},${sourceY} C${sourceX + controlOffset},${sourceY} ${targetX - controlOffset},${targetY} ${targetX},${targetY}`;

  const deleteEdge = useCallback(() => {
    const { setEdges, pushHistory } = useWorkflowEditorStore.getState();
    pushHistory();
    setEdges(useWorkflowEditorStore.getState().edges.filter((e) => e.id !== id));
  }, [id]);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: selected ? '#22d3ee' : '#52525b',
          strokeWidth: selected ? 3 : 2,
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <button
              onClick={deleteEdge}
              className="h-5 w-5 rounded-full bg-zinc-700 border border-zinc-500 hover:bg-red-500 hover:border-red-500 text-zinc-300 hover:text-white flex items-center justify-center text-xs transition-colors"
              aria-label="Delete edge"
            >
              ×
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function WorkflowCanvasInner() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    onConnect,
    addNode,
    selectNode,
    setNodes,
    setEdges,
    deleteNode,
    selectedNode,
    undo,
    redo,
    canUndo,
    canRedo,
    pushHistory,
    validationResult,
  } = useWorkflowEditorStore();

  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      } else if (isMod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        e.preventDefault();
        pushHistory();
        deleteNode(selectedNode.id);
        selectNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, canUndo, canRedo, undo, redo, deleteNode, selectNode, pushHistory]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(applyNodeChanges(changes, storeNodes) as EditorNode[]);
    },
    [storeNodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, storeEdges) as EditorEdge[]);
    },
    [storeEdges, setEdges]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      pushHistory();
      onConnect(connection);
    },
    [onConnect, pushHistory]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = event.currentTarget?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      pushHistory();
      addNode(type, position);
    },
    [addNode, pushHistory]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node as EditorNode);
    },
    [selectNode]
  );

  const handleNodeDragStart = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <style>{reactFlowOverrideStyles}</style>
      <ReactFlow
        nodes={storeNodes as Node[]}
        edges={storeEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onNodeDragStart={handleNodeDragStart}
        nodeTypes={nodeTypes}
        edgeTypes={{ deletable: DeletableEdge }}
        defaultEdgeOptions={{
          type: 'deletable',
          style: { stroke: '#52525b', strokeWidth: 2 },
        }}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#3f3f46" gap={16} />
        <Controls
          className="!bg-zinc-800 !border-zinc-600 !shadow-lg [&>button]:!bg-zinc-800 [&>button]:!border-zinc-600 [&>button>svg]:!fill-zinc-300"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-zinc-800 !border-zinc-600 !rounded-lg"
          nodeColor={(node) => nodeColorMap[node.type || ''] || '#71717a'}
          maskColor="rgba(0,0,0,0.7)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

export function WorkflowEditor() {
  const selectedNode = useWorkflowEditorStore((state) => state.selectedNode);

  return (
    <div className="flex" style={{ height: '100%' }}>
      {/* Main canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar row */}
        <div className="flex flex-col border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <div className="flex items-center justify-between px-4 py-3">
            <NodeToolbar />
          </div>
          {/* Validation status bar */}
          <ValidationStatusBar />
        </div>
        {/* Canvas */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ReactFlowProvider>
            <WorkflowCanvasInner />
          </ReactFlowProvider>
        </div>
      </div>

      {/* Right side panel - NodeConfigPanel, only visible when node selected */}
      {selectedNode && (
        <div className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-900 overflow-y-auto">
          <NodeConfigPanel />
        </div>
      )}
    </div>
  );
}