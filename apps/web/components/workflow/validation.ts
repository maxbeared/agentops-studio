import type { EditorNode, EditorEdge } from './editor-store';

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export type ValidationError = {
  id: string;
  message: string;
  nodeId?: string;
};

export type ValidationWarning = {
  id: string;
  message: string;
  nodeId?: string;
};

/**
 * Workflow validation rules
 */
export const validationRules = {
  /**
   * Must have exactly one start node
   */
  exactlyOneStart: (nodes: EditorNode[]): ValidationResult => {
    const startNodes = nodes.filter((n) => n.type === 'start');
    if (startNodes.length === 0) {
      return {
        valid: false,
        errors: [{ id: 'noStart', message: 'Workflow must have a Start node' }],
        warnings: [],
      };
    }
    if (startNodes.length > 1) {
      return {
        valid: false,
        errors: [{ id: 'multipleStarts', message: 'Workflow can only have one Start node' }],
        warnings: [],
      };
    }
    return { valid: true, errors: [], warnings: [] };
  },

  /**
   * Start node must have outgoing edges
   */
  startHasOutgoing: (nodes: EditorNode[], edges: EditorEdge[]): ValidationResult => {
    const startNode = nodes.find((n) => n.type === 'start');
    if (!startNode) {
      return { valid: true, errors: [], warnings: [] }; // Will be caught by exactlyOneStart
    }
    const hasOutgoing = edges.some((e) => e.source === startNode.id);
    if (!hasOutgoing) {
      return {
        valid: false,
        errors: [{ id: 'startNoOutgoing', message: 'Start node must connect to another node', nodeId: startNode.id }],
        warnings: [],
      };
    }
    return { valid: true, errors: [], warnings: [] };
  },

  /**
   * All nodes must be reachable from start
   */
  allNodesReachable: (nodes: EditorNode[], edges: EditorEdge[]): ValidationResult => {
    const startNode = nodes.find((n) => n.type === 'start');
    if (!startNode) {
      return { valid: true, errors: [], warnings: [] };
    }

    const reachable = new Set<string>();
    const queue = [startNode.id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);

      const outgoing = edges.filter((e) => e.source === current);
      for (const edge of outgoing) {
        if (!reachable.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }

    const unreachable = nodes.filter((n) => !reachable.has(n.id) && n.type !== 'start');
    if (unreachable.length > 0) {
      return {
        valid: false,
        errors: unreachable.map((n) => ({
          id: 'unreachableNode',
          message: `Node "${n.data.label}" is not connected to the workflow`,
          nodeId: n.id,
        })),
        warnings: [],
      };
    }
    return { valid: true, errors: [], warnings: [] };
  },

  /**
   * Condition nodes must have both yes and no edges
   */
  conditionHasBothBranches: (nodes: EditorNode[], edges: EditorEdge[]): ValidationResult => {
    const conditionNodes = nodes.filter((n) => n.type === 'condition');
    const errors: ValidationError[] = [];

    for (const node of conditionNodes) {
      const outgoing = edges.filter((e) => e.source === node.id);
      const hasYes = outgoing.some((e) => e.sourceHandle === 'yes');
      const hasNo = outgoing.some((e) => e.sourceHandle === 'no');

      if (!hasYes || !hasNo) {
        errors.push({
          id: 'conditionIncomplete',
          message: `Condition "${node.data.label}" must have both Yes and No branches`,
          nodeId: node.id,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  },

  /**
   * No orphan nodes (nodes with no incoming and no outgoing edges, except start)
   */
  noOrphanNodes: (nodes: EditorNode[], edges: EditorEdge[]): ValidationResult => {
    const orphans = nodes.filter((n) => {
      if (n.type === 'start') return false;
      const hasIncoming = edges.some((e) => e.target === n.id);
      const hasOutgoing = edges.some((e) => e.source === n.id);
      return !hasIncoming && !hasOutgoing;
    });

    if (orphans.length > 0) {
      return {
        valid: false,
        errors: orphans.map((n) => ({
          id: 'orphanNode',
          message: `Node "${n.data.label}" is not connected to any other node`,
          nodeId: n.id,
        })),
        warnings: [],
      };
    }
    return { valid: true, errors: [], warnings: [] };
  },

  /**
   * Merge nodes must have multiple incoming edges
   */
  mergeHasIncoming: (nodes: EditorNode[], edges: EditorEdge[]): ValidationResult => {
    const mergeNodes = nodes.filter((n) => n.type === 'merge');
    const errors: ValidationError[] = [];

    for (const node of mergeNodes) {
      const incoming = edges.filter((e) => e.target === node.id);
      if (incoming.length < 2) {
        errors.push({
          id: 'mergeIncomplete',
          message: `Merge "${node.data.label}" needs at least 2 incoming connections`,
          nodeId: node.id,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  },

  /**
   * Output node should not be directly after start (warning only)
   */
  outputAfterStart: (nodes: EditorNode[], edges: EditorEdge[]): ValidationResult => {
    const startNode = nodes.find((n) => n.type === 'start');
    if (!startNode) {
      return { valid: true, errors: [], warnings: [] };
    }

    const startOutgoing = edges.filter((e) => e.source === startNode.id);
    const warnings: ValidationWarning[] = [];

    for (const edge of startOutgoing) {
      const nextNode = nodes.find((n) => n.id === edge.target);
      if (nextNode?.type === 'output') {
        warnings.push({
          id: 'outputAfterStart',
          message: 'Output node directly after Start may not capture meaningful results',
          nodeId: nextNode.id,
        });
      }
    }

    return { valid: true, errors: [], warnings };
  },
};

/**
 * Run all validation rules on a workflow
 */
export function validateWorkflow(nodes: EditorNode[], edges: EditorEdge[]): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];

  // Run each validation rule
  const rules = [
    validationRules.exactlyOneStart,
    validationRules.startHasOutgoing,
    validationRules.allNodesReachable,
    validationRules.conditionHasBothBranches,
    validationRules.noOrphanNodes,
    validationRules.mergeHasIncoming,
  ];

  for (const rule of rules) {
    const result = rule(nodes, edges);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  // Also run warning-only rules
  const warningResult = validationRules.outputAfterStart(nodes, edges);
  allWarnings.push(...warningResult.warnings);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: ValidationResult): string[] {
  const messages: string[] = [];

  if (result.valid && result.warnings.length === 0) {
    messages.push('Workflow is valid');
    return messages;
  }

  for (const error of result.errors) {
    messages.push(`Error: ${error.message}`);
  }

  for (const warning of result.warnings) {
    messages.push(`Warning: ${warning.message}`);
  }

  return messages;
}
