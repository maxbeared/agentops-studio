'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from './editor-store';
import { Play, FileText, Bot, GitBranch, UserCheck, Webhook, LogOut } from 'lucide-react';

const nodeIcons: Record<string, React.ReactNode> = {
  start: <Play className="h-4 w-4" />,
  llm: <Bot className="h-4 w-4" />,
  retrieval: <FileText className="h-4 w-4" />,
  condition: <GitBranch className="h-4 w-4" />,
  review: <UserCheck className="h-4 w-4" />,
  webhook: <Webhook className="h-4 w-4" />,
  output: <LogOut className="h-4 w-4" />,
};

const nodeColors: Record<string, string> = {
  start: 'border-emerald-500 bg-emerald-500/10',
  llm: 'border-blue-500 bg-blue-500/10',
  retrieval: 'border-purple-500 bg-purple-500/10',
  condition: 'border-amber-500 bg-amber-500/10',
  review: 'border-pink-500 bg-pink-500/10',
  webhook: 'border-cyan-500 bg-cyan-500/10',
  output: 'border-slate-500 bg-slate-500/10',
};

export function StartNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border-2 p-3 min-w-[140px] ${nodeColors.start} ${selected ? 'ring-2 ring-emerald-400' : ''}`}>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-emerald-500/20 p-1.5 text-emerald-400">{nodeIcons.start}</div>
        <span className="font-medium text-emerald-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function LLMNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border-2 p-3 min-w-[160px] ${nodeColors.llm} ${selected ? 'ring-2 ring-blue-400' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-blue-500/20 p-1.5 text-blue-400">{nodeIcons.llm}</div>
        <span className="font-medium text-blue-400">{nodeData.label}</span>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">{nodeData.config?.model || 'gpt-4'}</p>
    </div>
  );
}

export function RetrievalNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border-2 p-3 min-w-[160px] ${nodeColors.retrieval} ${selected ? 'ring-2 ring-purple-400' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-purple-500/20 p-1.5 text-purple-400">{nodeIcons.retrieval}</div>
        <span className="font-medium text-purple-400">{nodeData.label}</span>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">Top-{nodeData.config?.topK || 5}</p>
    </div>
  );
}

export function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const condition = nodeData.config?.condition;
  return (
    <div className={`relative rounded-lg border-2 p-3 min-w-[160px] ${nodeColors.condition} ${selected ? 'ring-2 ring-amber-400' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />
      <Handle type="source" position={Position.Bottom} id="yes" className="!bg-amber-500" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="no" className="!bg-amber-500" style={{ left: '70%' }} />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-amber-500/20 p-1.5 text-amber-400">{nodeIcons.condition}</div>
        <span className="font-medium text-amber-400">{nodeData.label}</span>
      </div>
      {condition ? (
        <p className="mt-1.5 text-xs text-slate-400 truncate" title={condition}>{condition}</p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-500 italic">No condition set</p>
      )}
      <div className="mt-1 flex gap-1 text-xs">
        <span className="text-emerald-400">Y</span>
        <span className="text-slate-600">/</span>
        <span className="text-red-400">N</span>
      </div>
    </div>
  );
}

export function ReviewNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border-2 p-3 min-w-[160px] ${nodeColors.review} ${selected ? 'ring-2 ring-pink-400' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-pink-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-pink-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-pink-500/20 p-1.5 text-pink-400">{nodeIcons.review}</div>
        <span className="font-medium text-pink-400">{nodeData.label}</span>
      </div>
      <p className="mt-1.5 text-xs text-slate-400 truncate">{nodeData.config?.assigneeEmail || 'Unassigned'}</p>
    </div>
  );
}

export function WebhookNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border-2 p-3 min-w-[140px] ${nodeColors.webhook} ${selected ? 'ring-2 ring-cyan-400' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-cyan-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-cyan-500/20 p-1.5 text-cyan-400">{nodeIcons.webhook}</div>
        <span className="font-medium text-cyan-400">{nodeData.label}</span>
      </div>
      <p className="mt-1.5 text-xs text-slate-400 truncate">{nodeData.config?.method || 'POST'}</p>
    </div>
  );
}

export function OutputNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border-2 p-3 min-w-[140px] ${nodeColors.output} ${selected ? 'ring-2 ring-slate-400' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-slate-500/20 p-1.5 text-slate-400">{nodeIcons.output}</div>
        <span className="font-medium text-slate-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export const nodeTypes = {
  start: StartNode,
  llm: LLMNode,
  retrieval: RetrievalNode,
  condition: ConditionNode,
  review: ReviewNode,
  webhook: WebhookNode,
  output: OutputNode,
};
