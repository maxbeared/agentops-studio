import { create } from 'zustand';
import type { Node, Edge, Connection } from '@xyflow/react';

export type WorkflowNodeData = {
  label: string;
  type: 'start' | 'llm' | 'retrieval' | 'condition' | 'review' | 'webhook' | 'output';
  config: Record<string, any>;
};

export type EditorNode = Node<WorkflowNodeData>;
export type EditorEdge = Edge;

type WorkflowEditorState = {
  nodes: EditorNode[];
  edges: EditorEdge[];
  selectedNode: EditorNode | null;
  isDirty: boolean;
  workflowId: string | null;
  workflowName: string;
  lastSavedAt: number | null;

  setNodes: (nodes: EditorNode[]) => void;
  setEdges: (edges: EditorEdge[]) => void;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (node: EditorNode | null) => void;
  initWorkflow: (id: string, name: string, nodes: EditorNode[], edges: EditorEdge[]) => void;
  resetEditor: () => void;
  markSaved: () => void;
  updateNodesFromRf: (nodes: EditorNode[]) => void;
  updateEdgesFromRf: (edges: EditorEdge[]) => void;
};

const nodeTypeDefaults: Record<string, Partial<WorkflowNodeData>> = {
  start: { label: 'Start', config: {} },
  llm: { label: 'LLM Call', config: { model: 'gpt-4', prompt: '', temperature: 0.7 } },
  retrieval: { label: 'Knowledge Retrieval', config: { projectId: '', topK: 5 } },
  condition: { label: 'Condition', config: { condition: '' } },
  review: { label: 'Human Review', config: { assigneeEmail: '' } },
  webhook: { label: 'Webhook', config: { url: '', method: 'POST' } },
  output: { label: 'Output', config: { template: '' } },
};

let nodeIdCounter = 1;

const initialState = {
  nodes: [] as EditorNode[],
  edges: [] as EditorEdge[],
  selectedNode: null as EditorNode | null,
  isDirty: false,
  workflowId: null as string | null,
  workflowName: 'Untitled Workflow',
  lastSavedAt: null as number | null,
};

const CACHE_KEY_PREFIX = 'workflow_editor_';

function getCacheKey(workflowId: string): string {
  return `${CACHE_KEY_PREFIX}${workflowId}`;
}

function loadFromCache(workflowId: string): { nodes: EditorNode[]; edges: EditorEdge[] } | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(getCacheKey(workflowId));
    if (cached) {
      const parsed = JSON.parse(cached);
      return { nodes: parsed.nodes || [], edges: parsed.edges || [] };
    }
  } catch {
    // ignore cache errors
  }
  return null;
}

function saveToCache(workflowId: string, nodes: EditorNode[], edges: EditorEdge[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getCacheKey(workflowId), JSON.stringify({ nodes, edges }));
  } catch {
    // ignore cache errors
  }
}

function clearCache(workflowId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getCacheKey(workflowId));
  } catch {
    // ignore cache errors
  }
}

export const useWorkflowEditorStore = create<WorkflowEditorState>((set, get) => ({
  ...initialState,

  setNodes: (nodes) => {
    const { workflowId } = get();
    set({ nodes, isDirty: true });
    if (workflowId) saveToCache(workflowId, nodes, get().edges);
  },
  setEdges: (edges) => {
    const { workflowId, nodes } = get();
    set({ edges, isDirty: true });
    if (workflowId) saveToCache(workflowId, nodes, edges);
  },

  onNodesChange: (changes) => {
    const { nodes } = get();
    const positionChanges = changes.filter((c: any) => c.type === 'position' && c.position && c.dragging === false);
    const removeChanges = changes.filter((c: any) => c.type === 'remove');

    if (removeChanges.length > 0) {
      const idsToRemove = new Set(removeChanges.map((c: any) => c.id));
      const currentSelectedId = get().selectedNode?.id;

      set((state) => {
        const newNodes = state.nodes.filter((n) => !idsToRemove.has(n.id));
        const selectedNode = currentSelectedId && idsToRemove.has(currentSelectedId) ? null : state.selectedNode;
        const { workflowId } = state;
        if (workflowId) saveToCache(workflowId, newNodes, state.edges);
        return { nodes: newNodes, selectedNode, isDirty: true };
      });
    }

    if (positionChanges.length > 0) {
      set((state) => {
        const newNodes = state.nodes.map((n) => {
          const change = positionChanges.find((c: any) => c.id === n.id);
          return change && change.position ? { ...n, position: change.position } : n;
        });
        const { workflowId } = state;
        if (workflowId) saveToCache(workflowId, newNodes, state.edges);
        return { nodes: newNodes, isDirty: true };
      });
    }
  },

  onEdgesChange: (changes) => {
    const removeChanges = changes.filter((c: any) => c.type === 'remove');

    if (removeChanges.length > 0) {
      const idsToRemove = new Set(removeChanges.map((c: any) => c.id));
      set((state) => {
        const newEdges = state.edges.filter((e) => !idsToRemove.has(e.id));
        const { workflowId } = state;
        if (workflowId) saveToCache(workflowId, state.nodes, newEdges);
        return { edges: newEdges, isDirty: true };
      });
    }
  },

  onConnect: (connection) => {
    const newEdge: EditorEdge = {
      id: `e${connection.source}-${connection.target}${connection.sourceHandle ? `-${connection.sourceHandle}` : ''}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'default',
    };
    set((state) => {
      const newEdges = [...state.edges, newEdge];
      if (state.workflowId) saveToCache(state.workflowId, state.nodes, newEdges);
      return { edges: newEdges, isDirty: true };
    });
  },

  addNode: (type, position) => {
    const id = `${type}_${nodeIdCounter++}`;
    const defaults = nodeTypeDefaults[type] || { label: type, config: {} };
    const newNode: EditorNode = {
      id,
      type,
      position,
      data: {
        ...defaults,
        type,
      } as WorkflowNodeData,
    };
    set((state) => {
      const newNodes = [...state.nodes, newNode];
      if (state.workflowId) saveToCache(state.workflowId, newNodes, state.edges);
      return { nodes: newNodes, isDirty: true };
    });
  },

  updateNodeData: (nodeId, data) => {
    set((state) => {
      const newNodes = state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      );
      const newSelectedNode = state.selectedNode?.id === nodeId
        ? { ...state.selectedNode, data: { ...state.selectedNode.data, ...data } }
        : state.selectedNode;
      if (state.workflowId) saveToCache(state.workflowId, newNodes, state.edges);
      return { nodes: newNodes, selectedNode: newSelectedNode, isDirty: true };
    });
  },

  deleteNode: (nodeId) => {
    set((state) => {
      const newNodes = state.nodes.filter((n) => n.id !== nodeId);
      const newEdges = state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      const newSelectedNode = state.selectedNode?.id === nodeId ? null : state.selectedNode;
      if (state.workflowId) saveToCache(state.workflowId, newNodes, newEdges);
      return { nodes: newNodes, edges: newEdges, selectedNode: newSelectedNode, isDirty: true };
    });
  },

  selectNode: (node) => set({ selectedNode: node }),

  initWorkflow: (id, name, nodes, edges) => {
    nodeIdCounter = 1;
    nodes.forEach((n) => {
      const match = n.id.match(/_(\d+)$/);
      if (match) {
        nodeIdCounter = Math.max(nodeIdCounter, parseInt(match[1], 10) + 1);
      }
    });

    set({
      workflowId: id,
      workflowName: name,
      nodes,
      edges,
      isDirty: false,
      selectedNode: null,
      lastSavedAt: null,
    });
  },

  resetEditor: () => {
    const { workflowId } = get();
    if (workflowId) clearCache(workflowId);
    nodeIdCounter = 1;
    set({ ...initialState });
  },

  markSaved: () => {
    set({ isDirty: false, lastSavedAt: Date.now() });
  },

  updateNodesFromRf: (nodes: EditorNode[]) => {
    set({ nodes, isDirty: true });
    const { workflowId, edges } = get();
    if (workflowId) saveToCache(workflowId, nodes, edges);
  },

  updateEdgesFromRf: (edges: EditorEdge[]) => {
    set({ edges, isDirty: true });
    const { workflowId, nodes } = get();
    if (workflowId) saveToCache(workflowId, nodes, edges);
  },
}));