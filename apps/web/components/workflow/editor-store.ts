import { create } from 'zustand';
import type { Node, Edge, Connection } from '@xyflow/react';
import { validateWorkflow, type ValidationResult } from './validation';

export type WorkflowNodeData = {
  label: string;
  type: 'start' | 'llm' | 'retrieval' | 'condition' | 'review' | 'webhook' | 'output' | 'input' | 'text' | 'loop' | 'delay' | 'transform' | 'code' | 'merge' | 'errorHandler';
  config: Record<string, any>;
};

export type EditorNode = Node<WorkflowNodeData>;
export type EditorEdge = Edge;

type HistoryEntry = {
  nodes: EditorNode[];
  edges: EditorEdge[];
};

type WorkflowEditorState = {
  nodes: EditorNode[];
  edges: EditorEdge[];
  selectedNode: EditorNode | null;
  isDirty: boolean;
  workflowId: string | null;
  workflowName: string;
  lastSavedAt: number | null;
  validationResult: ValidationResult | null;
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  setNodes: (nodes: EditorNode[]) => void;
  setEdges: (edges: EditorEdge[]) => void;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position: { x: number; y: number }, label?: string) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (node: EditorNode | null) => void;
  initWorkflow: (id: string, name: string, nodes: EditorNode[], edges: EditorEdge[]) => void;
  resetEditor: () => void;
  markSaved: () => void;
  updateNodesFromRf: (nodes: EditorNode[]) => void;
  updateEdgesFromRf: (edges: EditorEdge[]) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
};

const MAX_HISTORY_SIZE = 50;

const nodeTypeDefaults: Record<string, Partial<WorkflowNodeData>> = {
  start: { label: 'Start', config: {} },
  llm: { label: 'LLM Call', config: { model: 'gpt-4', prompt: '', temperature: 0.7 } },
  retrieval: { label: 'Knowledge Retrieval', config: { projectId: '', topK: 5 } },
  condition: { label: 'Condition', config: { condition: '' } },
  review: { label: 'Human Review', config: { assigneeEmail: '' } },
  webhook: { label: 'Webhook', config: { url: '', method: 'POST' } },
  output: { label: 'Output', config: { template: '' } },
  input: { label: 'Input', config: { inputSchema: { fields: [] } } },
  text: { label: 'Text', config: { operation: 'trim', value: '' } },
  loop: { label: 'Loop', config: { items: [], maxIterations: 100 } },
  delay: { label: 'Delay', config: { duration: 1, unit: 'seconds' } },
  transform: { label: 'Transform', config: { template: '' } },
  code: { label: 'Code', config: { language: 'javascript', code: '' } },
  merge: { label: 'Merge', config: { strategy: 'all' } },
  errorHandler: { label: 'Error Handler', config: { fallbackOutput: {}, captureError: true } },
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
  validationResult: null as ValidationResult | null,
  history: [] as HistoryEntry[],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
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
      // Ensure all edges have type 'deletable'
      const edges = (parsed.edges || []).map((e: EditorEdge) => ({ ...e, type: 'deletable' as const }));
      return { nodes: parsed.nodes || [], edges };
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

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function runValidation(nodes: EditorNode[], edges: EditorEdge[]): ValidationResult {
  return validateWorkflow(nodes, edges);
}

export const useWorkflowEditorStore = create<WorkflowEditorState>((set, get) => ({
  ...initialState,

  pushHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newEntry: HistoryEntry = { nodes: deepClone(nodes), edges: deepClone(edges) };

    // Truncate history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);

    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const entry = history[newIndex];

    set({
      nodes: deepClone(entry.nodes),
      edges: deepClone(entry.edges),
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
      isDirty: true,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const entry = history[newIndex];

    set({
      nodes: deepClone(entry.nodes),
      edges: deepClone(entry.edges),
      historyIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < history.length - 1,
      isDirty: true,
    });
  },

  setNodes: (nodes) => {
    const { workflowId, edges } = get();
    const validation = runValidation(nodes, edges);
    set({ nodes, isDirty: true, validationResult: validation });
    if (workflowId) saveToCache(workflowId, nodes, edges);
  },

  setEdges: (edges) => {
    const { workflowId, nodes } = get();
    const validation = runValidation(nodes, edges);
    set({ edges, isDirty: true, validationResult: validation });
    if (workflowId) saveToCache(workflowId, nodes, edges);
  },

  onNodesChange: (changes) => {
    const positionChanges = changes.filter((c: any) => c.type === 'position' && c.position && c.dragging === false);
    const removeChanges = changes.filter((c: any) => c.type === 'remove');

    if (removeChanges.length > 0) {
      const idsToRemove = new Set(removeChanges.map((c: any) => c.id));
      const currentSelectedId = get().selectedNode?.id;

      set((state) => {
        const newNodes = state.nodes.filter((n) => !idsToRemove.has(n.id));
        const newEdges = state.edges.filter((e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target));
        const selectedNode = currentSelectedId && idsToRemove.has(currentSelectedId) ? null : state.selectedNode;
        const validation = runValidation(newNodes, newEdges);
        if (state.workflowId) saveToCache(state.workflowId, newNodes, newEdges);
        return { nodes: newNodes, edges: newEdges, selectedNode, isDirty: true, validationResult: validation };
      });
    }

    if (positionChanges.length > 0) {
      set((state) => {
        const newNodes = state.nodes.map((n) => {
          const change = positionChanges.find((c: any) => c.id === n.id);
          return change && change.position ? { ...n, position: change.position } : n;
        });
        if (state.workflowId) saveToCache(state.workflowId, newNodes, state.edges);
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
        const validation = runValidation(state.nodes, newEdges);
        if (state.workflowId) saveToCache(state.workflowId, state.nodes, newEdges);
        return { edges: newEdges, isDirty: true, validationResult: validation };
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
      type: 'deletable',
    };
    set((state) => {
      const newEdges = [...state.edges, newEdge];
      const validation = runValidation(state.nodes, newEdges);
      if (state.workflowId) saveToCache(state.workflowId, state.nodes, newEdges);
      return { edges: newEdges, isDirty: true, validationResult: validation };
    });
  },

  addNode: (type, position, label) => {
    const id = `${type}_${nodeIdCounter++}`;
    const defaults = nodeTypeDefaults[type] || { label: type, config: {} };
    const newNode: EditorNode = {
      id,
      type,
      position,
      data: {
        ...defaults,
        type,
        label: label || defaults.label || type,
      } as WorkflowNodeData,
    };
    set((state) => {
      const newNodes = [...state.nodes, newNode];
      const validation = runValidation(newNodes, state.edges);
      if (state.workflowId) saveToCache(state.workflowId, newNodes, state.edges);
      return { nodes: newNodes, isDirty: true, validationResult: validation };
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
      const validation = runValidation(newNodes, state.edges);
      if (state.workflowId) saveToCache(state.workflowId, newNodes, state.edges);
      return { nodes: newNodes, selectedNode: newSelectedNode, isDirty: true, validationResult: validation };
    });
  },

  deleteNode: (nodeId) => {
    set((state) => {
      // Prevent deleting Start node
      const nodeToDelete = state.nodes.find((n) => n.id === nodeId);
      if (nodeToDelete?.type === 'start') {
        return state; // No changes
      }
      const newNodes = state.nodes.filter((n) => n.id !== nodeId);
      const newEdges = state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      const newSelectedNode = state.selectedNode?.id === nodeId ? null : state.selectedNode;
      const validation = runValidation(newNodes, newEdges);
      if (state.workflowId) saveToCache(state.workflowId, newNodes, newEdges);
      return { nodes: newNodes, edges: newEdges, selectedNode: newSelectedNode, isDirty: true, validationResult: validation };
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

    // Ensure there's always a Start node
    let workflowNodes = [...nodes];
    let workflowEdges = [...edges];
    const hasStartNode = workflowNodes.some((n) => n.type === 'start');

    if (!hasStartNode) {
      const startNode: EditorNode = {
        id: 'start_1',
        type: 'start',
        position: { x: 250, y: 50 },
        data: { label: 'Start', type: 'start', config: {} },
      };
      workflowNodes = [startNode, ...workflowNodes];
      nodeIdCounter = 2;
    }

    const validation = runValidation(workflowNodes, workflowEdges);

    set({
      workflowId: id,
      workflowName: name,
      nodes: workflowNodes,
      edges: workflowEdges,
      isDirty: false,
      selectedNode: null,
      lastSavedAt: null,
      validationResult: validation,
      history: [{ nodes: deepClone(workflowNodes), edges: deepClone(workflowEdges) }],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  },

  resetEditor: () => {
    const { workflowId } = get();
    if (workflowId) clearCache(workflowId);
    nodeIdCounter = 1;
    set({ ...initialState });
  },

  markSaved: () => {
    const { nodes, edges } = get();
    set({ isDirty: false, lastSavedAt: Date.now() });
    // Update history to mark as saved
    set((state) => ({
      history: [{ nodes: deepClone(nodes), edges: deepClone(edges) }],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    }));
  },

  updateNodesFromRf: (nodes: EditorNode[]) => {
    const { workflowId, edges } = get();
    const validation = runValidation(nodes, edges);
    set({ nodes, isDirty: true, validationResult: validation });
    if (workflowId) saveToCache(workflowId, nodes, edges);
  },

  updateEdgesFromRf: (edges: EditorEdge[]) => {
    const { workflowId, nodes } = get();
    const validation = runValidation(nodes, edges);
    set({ edges, isDirty: true, validationResult: validation });
    if (workflowId) saveToCache(workflowId, nodes, edges);
  },
}));