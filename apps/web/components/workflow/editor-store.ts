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
};

export const useWorkflowEditorStore = create<WorkflowEditorState>((set, get) => ({
  ...initialState,

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) => {
    set((state) => {
      let nodes = state.nodes;
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.dragging === false) {
          nodes = nodes.map((n) =>
            n.id === change.id ? { ...n, position: change.position! } : n
          );
        }
        if (change.type === 'remove') {
          nodes = nodes.filter((n) => n.id !== change.id);
          if (state.selectedNode?.id === change.id) {
            set({ selectedNode: null });
          }
        }
      });
      return { nodes, isDirty: true };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      let edges = state.edges;
      changes.forEach((change) => {
        if (change.type === 'remove') {
          edges = edges.filter((e) => e.id !== change.id);
        }
      });
      return { edges, isDirty: true };
    });
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
    set((state) => ({
      edges: [...state.edges, newEdge],
      isDirty: true,
    }));
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
    set((state) => ({
      nodes: [...state.nodes, newNode],
      isDirty: true,
    }));
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
      selectedNode: state.selectedNode?.id === nodeId
        ? { ...state.selectedNode, data: { ...state.selectedNode.data, ...data } }
        : state.selectedNode,
      isDirty: true,
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      isDirty: true,
    }));
  },

  selectNode: (node) => set({ selectedNode: node }),

  initWorkflow: (id, name, nodes, edges) => {
    nodeIdCounter = Math.max(
      ...nodes.map((n) => {
        const match = n.id.match(/_(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      }),
      0
    ) + 1;
    set({ workflowId: id, workflowName: name, nodes, edges, isDirty: false, selectedNode: null });
  },

  resetEditor: () => {
    nodeIdCounter = 1;
    set({ ...initialState });
  },
}));
