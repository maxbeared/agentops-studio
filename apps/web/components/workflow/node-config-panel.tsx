'use client';

import { X, Trash2 } from 'lucide-react';
import { useWorkflowEditorStore } from './editor-store';
import type { WorkflowNodeData } from './editor-store';

const nodeTypeLabels: Record<string, string> = {
  start: 'Start Node',
  llm: 'LLM Call Node',
  retrieval: 'Retrieval Node',
  condition: 'Condition Node',
  review: 'Review Node',
  webhook: 'Webhook Node',
  output: 'Output Node',
};

function LLMConfig({ data, onChange }: { data: WorkflowNodeData; onChange: (config: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="llm-model" className="block text-xs text-slate-400 mb-1">Model</label>
        <select
          id="llm-model"
          value={data.config?.model || 'gpt-4'}
          onChange={(e) => onChange({ ...data.config, model: e.target.value })}
          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
        </select>
      </div>
      <div>
        <label htmlFor="llm-temperature" className="block text-xs text-slate-400 mb-1">Temperature</label>
        <input
          id="llm-temperature"
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={data.config?.temperature ?? 0.7}
          onChange={(e) => onChange({ ...data.config, temperature: parseFloat(e.target.value) })}
          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="llm-prompt" className="block text-xs text-slate-400 mb-1">System Prompt</label>
        <textarea
          id="llm-prompt"
          value={data.config?.prompt || ''}
          onChange={(e) => onChange({ ...data.config, prompt: e.target.value })}
          placeholder="You are a helpful assistant..."
          rows={4}
          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white resize-none"
        />
      </div>
    </div>
  );
}

function RetrievalConfig({ data, onChange }: { data: WorkflowNodeData; onChange: (config: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="retrieval-kb-id" className="block text-xs text-slate-400 mb-1">Knowledge Base ID</label>
        <input
          id="retrieval-kb-id"
          type="text"
          value={data.config?.knowledgeBaseId || ''}
          onChange={(e) => onChange({ ...data.config, knowledgeBaseId: e.target.value })}
          placeholder="Select knowledge base"
          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="retrieval-topk" className="block text-xs text-slate-400 mb-1">Top-K Results</label>
        <input
          id="retrieval-topk"
          type="number"
          min="1"
          max="20"
          value={data.config?.topK ?? 5}
          onChange={(e) => onChange({ ...data.config, topK: parseInt(e.target.value, 10) })}
          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white"
        />
      </div>
    </div>
  );
}

function ReviewConfig({ data, onChange }: { data: WorkflowNodeData; onChange: (config: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="review-email" className="block text-xs text-slate-400 mb-1">Assignee Email</label>
        <input
          id="review-email"
          type="email"
          value={data.config?.assigneeEmail || ''}
          onChange={(e) => onChange({ ...data.config, assigneeEmail: e.target.value })}
          placeholder="reviewer@company.com"
          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white"
        />
      </div>
    </div>
  );
}

function WebhookConfig({ data, onChange }: { data: WorkflowNodeData; onChange: (config: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="webhook-method" className="block text-xs text-slate-400 mb-1">Method</label>
        <select
          id="webhook-method"
          value={data.config?.method || 'POST'}
          onChange={(e) => onChange({ ...data.config, method: e.target.value })}
          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div>
        <label htmlFor="webhook-url" className="block text-xs text-slate-400 mb-1">URL</label>
        <input
          id="webhook-url"
          type="url"
          value={data.config?.url || ''}
          onChange={(e) => onChange({ ...data.config, url: e.target.value })}
          placeholder="https://api.example.com/endpoint"
          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white"
        />
      </div>
    </div>
  );
}

function ConditionConfig({ data, onChange }: { data: WorkflowNodeData; onChange: (config: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="condition-expression" className="block text-xs text-slate-400 mb-1">Condition Expression</label>
        <textarea
          id="condition-expression"
          value={data.config?.condition || ''}
          onChange={(e) => onChange({ ...data.config, condition: e.target.value })}
          placeholder="e.g., input.score > 0.5"
          rows={3}
          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white resize-none font-mono"
          aria-describedby="condition-help"
        />
      </div>
      <div id="condition-help" className="rounded bg-slate-800/50 p-2 text-xs text-slate-500">
        <p className="font-medium text-slate-400 mb-1">Available variables:</p>
        <ul className="space-y-0.5">
          <li><code className="text-purple-400">input.*</code> - workflow input</li>
          <li><code className="text-purple-400">prev.*</code> - previous node output</li>
          <li><code className="text-purple-400">outputs.*</code> - all outputs</li>
          <li><code className="text-purple-400">state.*</code> - current state</li>
        </ul>
      </div>
      <div className="rounded bg-slate-800/50 p-2 text-xs text-slate-500">
        <p className="font-medium text-slate-400 mb-1">Examples:</p>
        <ul className="space-y-0.5">
          <li><code className="text-blue-400">input.score &gt; 0.5</code></li>
          <li><code className="text-blue-400">prev.LLM.content.includes('error')</code></li>
          <li><code className="text-blue-400">input.status === 'approved'</code></li>
        </ul>
      </div>
    </div>
  );
}

function OutputConfig({ data, onChange }: { data: WorkflowNodeData; onChange: (config: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="output-template" className="block text-xs text-slate-400 mb-1">Output Template</label>
        <textarea
          id="output-template"
          value={data.config?.template || ''}
          onChange={(e) => onChange({ ...data.config, template: e.target.value })}
          placeholder="The result is: {{result}}"
          rows={4}
          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white resize-none"
        />
      </div>
    </div>
  );
}

export function NodeConfigPanel() {
  const { selectedNode, updateNodeData, deleteNode, selectNode } = useWorkflowEditorStore();

  if (!selectedNode) return null;

  const handleConfigChange = (config: Record<string, any>) => {
    updateNodeData(selectedNode.id, { config });
  };

  return (
    <div className="absolute right-4 top-20 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div>
          <h3 className="font-medium text-white">{nodeTypeLabels[selectedNode.type ?? ''] || 'Node'}</h3>
          <p className="text-xs text-slate-500">{selectedNode.id}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => deleteNode(selectedNode.id)}
            className="rounded p-1.5 text-red-400 hover:bg-red-500/20"
            aria-label="Delete node"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => selectNode(null)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <label htmlFor="node-name" className="block text-xs text-slate-400 mb-1">Node Name</label>
          <input
            id="node-name"
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white"
            aria-label="Node name"
          />
        </div>
        {selectedNode.type === 'llm' && <LLMConfig data={selectedNode.data} onChange={handleConfigChange} />}
        {selectedNode.type === 'retrieval' && <RetrievalConfig data={selectedNode.data} onChange={handleConfigChange} />}
        {selectedNode.type === 'condition' && <ConditionConfig data={selectedNode.data} onChange={handleConfigChange} />}
        {selectedNode.type === 'review' && <ReviewConfig data={selectedNode.data} onChange={handleConfigChange} />}
        {selectedNode.type === 'webhook' && <WebhookConfig data={selectedNode.data} onChange={handleConfigChange} />}
        {selectedNode.type === 'output' && <OutputConfig data={selectedNode.data} onChange={handleConfigChange} />}
      </div>
    </div>
  );
}
