'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from './editor-store';
import { Play, FileText, Bot, GitBranch, UserCheck, Webhook, LogOut, Type, Repeat, Clock, Shuffle, Code, GitMerge, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';

const nodeIcons: Record<string, React.ReactNode> = {
  start: <Play className="h-4 w-4" />,
  llm: <Bot className="h-4 w-4" />,
  retrieval: <FileText className="h-4 w-4" />,
  condition: <GitBranch className="h-4 w-4" />,
  review: <UserCheck className="h-4 w-4" />,
  webhook: <Webhook className="h-4 w-4" />,
  output: <LogOut className="h-4 w-4" />,
  input: <FileText className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  loop: <Repeat className="h-4 w-4" />,
  delay: <Clock className="h-4 w-4" />,
  transform: <Shuffle className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  merge: <GitMerge className="h-4 w-4" />,
  errorHandler: <AlertTriangle className="h-4 w-4" />,
};

const nodeColors: Record<string, string> = {
  start: 'border-emerald-500 bg-emerald-500/10',
  llm: 'border-blue-500 bg-blue-500/10',
  retrieval: 'border-purple-500 bg-purple-500/10',
  condition: 'border-amber-500 bg-amber-500/10',
  review: 'border-pink-500 bg-pink-500/10',
  webhook: 'border-cyan-500 bg-cyan-500/10',
  output: 'border-zinc-500 bg-zinc-500/10',
  input: 'border-teal-500 bg-teal-500/10',
  text: 'border-orange-500 bg-orange-500/10',
  loop: 'border-green-500 bg-green-500/10',
  delay: 'border-yellow-500 bg-yellow-500/10',
  transform: 'border-indigo-500 bg-indigo-500/10',
  code: 'border-red-500 bg-red-500/10',
  merge: 'border-violet-500 bg-violet-500/10',
  errorHandler: 'border-rose-500 bg-rose-500/10',
};

export function StartNode({ data, selected }: NodeProps) {
  const { t } = useTranslation();
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-emerald-500 bg-emerald-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-emerald-400' : ''}`}>
      <Handle type="source" position={Position.Right} className="!bg-emerald-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-emerald-500/20 p-1.5 text-emerald-400">{nodeIcons.start}</div>
        <span className="font-medium text-emerald-400">{t('editor.nodes.start')}</span>
      </div>
    </div>
  );
}

export function LLMNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-blue-500 bg-blue-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-blue-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-blue-500/20 p-1.5 text-blue-400">{nodeIcons.llm}</div>
        <span className="font-medium text-blue-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function RetrievalNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-purple-500 bg-purple-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-purple-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-purple-500" />
      <Handle type="source" position={Position.Right} className="!bg-purple-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-purple-500/20 p-1.5 text-purple-400">{nodeIcons.retrieval}</div>
        <span className="font-medium text-purple-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-amber-500 bg-amber-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-amber-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-amber-500" />
      <Handle type="source" position={Position.Right} id="yes" className="!bg-amber-500" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Right} id="no" className="!bg-amber-500" style={{ top: '70%' }} />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-amber-500/20 p-1.5 text-amber-400">{nodeIcons.condition}</div>
        <span className="font-medium text-amber-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function ReviewNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-pink-500 bg-pink-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-pink-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-pink-500" />
      <Handle type="source" position={Position.Right} className="!bg-pink-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-pink-500/20 p-1.5 text-pink-400">{nodeIcons.review}</div>
        <span className="font-medium text-pink-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function WebhookNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-cyan-500 bg-cyan-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-cyan-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-cyan-500" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-cyan-500/20 p-1.5 text-cyan-400">{nodeIcons.webhook}</div>
        <span className="font-medium text-cyan-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function OutputNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-zinc-500 bg-zinc-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-zinc-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-zinc-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-zinc-500/20 p-1.5 text-zinc-400">{nodeIcons.output}</div>
        <span className="font-medium text-zinc-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function InputNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-teal-500 bg-teal-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-teal-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-teal-500" />
      <Handle type="source" position={Position.Right} className="!bg-teal-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-teal-500/20 p-1.5 text-teal-400">{nodeIcons.input}</div>
        <span className="font-medium text-teal-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function TextNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-orange-500 bg-orange-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-orange-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-orange-500" />
      <Handle type="source" position={Position.Right} className="!bg-orange-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-orange-500/20 p-1.5 text-orange-400">{nodeIcons.text}</div>
        <span className="font-medium text-orange-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function LoopNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-green-500 bg-green-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-green-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-green-500" />
      <Handle type="source" position={Position.Right} className="!bg-green-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-green-500/20 p-1.5 text-green-400">{nodeIcons.loop}</div>
        <span className="font-medium text-green-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function DelayNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-yellow-500 bg-yellow-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-yellow-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-yellow-500" />
      <Handle type="source" position={Position.Right} className="!bg-yellow-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-yellow-500/20 p-1.5 text-yellow-400">{nodeIcons.delay}</div>
        <span className="font-medium text-yellow-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function TransformNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-indigo-500 bg-indigo-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-indigo-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-indigo-500" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-indigo-500/20 p-1.5 text-indigo-400">{nodeIcons.transform}</div>
        <span className="font-medium text-indigo-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function CodeNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-red-500 bg-red-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-red-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-red-500" />
      <Handle type="source" position={Position.Right} className="!bg-red-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-red-500/20 p-1.5 text-red-400">{nodeIcons.code}</div>
        <span className="font-medium text-red-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function MergeNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-violet-500 bg-violet-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-violet-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-violet-500" />
      <Handle type="source" position={Position.Right} className="!bg-violet-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-violet-500/20 p-1.5 text-violet-400">{nodeIcons.merge}</div>
        <span className="font-medium text-violet-400">{nodeData.label}</span>
      </div>
    </div>
  );
}

export function ErrorHandlerNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div className={`relative rounded-lg border border-rose-500 bg-rose-500/10 p-3 min-w-[120px] ${selected ? 'ring-2 ring-rose-400' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-rose-500" />
      <Handle type="source" position={Position.Right} className="!bg-rose-500" />
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-rose-500/20 p-1.5 text-rose-400">{nodeIcons.errorHandler}</div>
        <span className="font-medium text-rose-400">{nodeData.label}</span>
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
  input: InputNode,
  text: TextNode,
  loop: LoopNode,
  delay: DelayNode,
  transform: TransformNode,
  code: CodeNode,
  merge: MergeNode,
  errorHandler: ErrorHandlerNode,
};