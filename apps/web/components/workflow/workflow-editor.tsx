'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowEditorStore, EditorNode, EditorEdge } from './editor-store';
import { nodeTypes } from './nodes';
import { NodeToolbar } from './toolbar';

const nodeColorMap: Record<string, string> = {
  start: '#10b981',
  llm: '#3b82f6',
  retrieval: '#a855f7',
  condition: '#f59e0b',
  review: '#ec4899',
  webhook: '#06b6d4',
  output: '#71717a',
};

function WorkflowCanvasInner() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    onConnect,
    addNode,
    selectNode,
    setNodes,
    setEdges,
  } = useWorkflowEditorStore();

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
      onConnect(connection);
    },
    [onConnect]
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

      addNode(type, position);
    },
    [addNode]
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

  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
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
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'default',
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
  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 shrink-0">
        <NodeToolbar />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <ReactFlowProvider>
          <WorkflowCanvasInner />
        </ReactFlowProvider>
      </div>
    </div>
  );
}