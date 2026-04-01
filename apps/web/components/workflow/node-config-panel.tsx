'use client';

import { X, Trash2 } from 'lucide-react';
import { useWorkflowEditorStore } from './editor-store';
import type { WorkflowNodeData } from './editor-store';
import { useTranslation } from '../../contexts/locale-context';
import { Button } from '../ui';

function getNodeTypeLabel(type: string, t: (key: string) => string): string {
  const labels: Record<string, string> = {
    start: t('editor.nodes.start'),
    llm: t('editor.nodes.llmCall'),
    retrieval: t('editor.nodes.knowledgeRetrieval'),
    condition: t('editor.nodes.condition'),
    review: t('editor.nodes.humanReview'),
    webhook: t('editor.nodes.webhook'),
    output: t('editor.nodes.output'),
  };
  return labels[type] || type;
}

interface ConfigProps {
  data: WorkflowNodeData;
  onChange: (config: Record<string, any>) => void;
  t: (key: string) => string;
}

function LLMConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="llm-model" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.model')}</label>
        <select
          id="llm-model"
          value={data.config?.model || 'gpt-4'}
          onChange={(e) => onChange({ ...data.config, model: e.target.value })}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
        </select>
      </div>
      <div>
        <label htmlFor="llm-temperature" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.temperature')}</label>
        <input
          id="llm-temperature"
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={data.config?.temperature ?? 0.7}
          onChange={(e) => onChange({ ...data.config, temperature: parseFloat(e.target.value) })}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
      <div>
        <label htmlFor="llm-prompt" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.prompt')}</label>
        <textarea
          id="llm-prompt"
          value={data.config?.prompt || ''}
          onChange={(e) => onChange({ ...data.config, prompt: e.target.value })}
          placeholder={t('editor.nodeConfig.enterPrompt')}
          rows={4}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white resize-none focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
    </div>
  );
}

function RetrievalConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="retrieval-kb-id" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.knowledgeBase')}</label>
        <input
          id="retrieval-kb-id"
          type="text"
          value={data.config?.knowledgeBaseId || ''}
          onChange={(e) => onChange({ ...data.config, knowledgeBaseId: e.target.value })}
          placeholder={t('editor.nodeConfig.selectKnowledgeBase')}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
      <div>
        <label htmlFor="retrieval-topk" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.topK')}</label>
        <input
          id="retrieval-topk"
          type="number"
          min="1"
          max="20"
          value={data.config?.topK ?? 5}
          onChange={(e) => onChange({ ...data.config, topK: parseInt(e.target.value, 10) })}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
    </div>
  );
}

function ReviewConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="review-email" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.assignee')}</label>
        <input
          id="review-email"
          type="email"
          value={data.config?.assigneeEmail || ''}
          onChange={(e) => onChange({ ...data.config, assigneeEmail: e.target.value })}
          placeholder={t('editor.nodeConfig.enterEmail')}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
    </div>
  );
}

function WebhookConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="webhook-method" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.method')}</label>
        <select
          id="webhook-method"
          value={data.config?.method || 'POST'}
          onChange={(e) => onChange({ ...data.config, method: e.target.value })}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div>
        <label htmlFor="webhook-url" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.url')}</label>
        <input
          id="webhook-url"
          type="url"
          value={data.config?.url || ''}
          onChange={(e) => onChange({ ...data.config, url: e.target.value })}
          placeholder={t('editor.nodeConfig.enterUrl')}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
    </div>
  );
}

function ConditionConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="condition-expression" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.condition')}</label>
        <textarea
          id="condition-expression"
          value={data.config?.condition || ''}
          onChange={(e) => onChange({ ...data.config, condition: e.target.value })}
          placeholder={t('editor.nodeConfig.conditionPlaceholder')}
          rows={3}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white resize-none font-mono focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          aria-describedby="condition-help"
        />
      </div>
      <div id="condition-help" className="rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-500">
        <p className="font-medium text-zinc-400 mb-1">{t('editor.nodeConfig.availableVars')}:</p>
        <ul className="space-y-0.5">
          <li><code className="text-purple-400">input.*</code> - {t('editor.nodeConfig.varInput')}</li>
          <li><code className="text-purple-400">prev.*</code> - {t('editor.nodeConfig.varPrev')}</li>
          <li><code className="text-purple-400">outputs.*</code> - {t('editor.nodeConfig.varOutputs')}</li>
          <li><code className="text-purple-400">state.*</code> - {t('editor.nodeConfig.varState')}</li>
        </ul>
      </div>
    </div>
  );
}

function OutputConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="output-template" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.template')}</label>
        <textarea
          id="output-template"
          value={data.config?.template || ''}
          onChange={(e) => onChange({ ...data.config, template: e.target.value })}
          placeholder={t('editor.nodeConfig.enterTemplate')}
          rows={4}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white resize-none focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
    </div>
  );
}

export function NodeConfigPanel() {
  const { selectedNode, updateNodeData, deleteNode, selectNode } = useWorkflowEditorStore();
  const { t } = useTranslation();

  if (!selectedNode) return null;

  const handleConfigChange = (config: Record<string, any>) => {
    updateNodeData(selectedNode.id, { config });
  };

  const handleLabelChange = (label: string) => {
    updateNodeData(selectedNode.id, { label });
  };

  return (
    <div className="absolute right-4 top-20 w-80 rounded-xl border border-zinc-700/50 bg-zinc-900/95 shadow-xl backdrop-blur-sm z-50">
      <div className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3">
        <div>
          <h3 className="font-medium text-white">{getNodeTypeLabel(selectedNode.type ?? '', t)}</h3>
          <p className="text-xs text-zinc-500">{selectedNode.id}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => deleteNode(selectedNode.id)}
            aria-label={t('common.delete')}
            icon={<Trash2 className="h-4 w-4" />}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => selectNode(null)}
            aria-label={t('common.close')}
            icon={<X className="h-4 w-4" />}
          />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <label htmlFor="node-name" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.name')}</label>
          <input
            id="node-name"
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label={t('editor.nodeConfig.name')}
          />
        </div>
        {selectedNode.type === 'llm' && <LLMConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'retrieval' && <RetrievalConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'condition' && <ConditionConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'review' && <ReviewConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'webhook' && <WebhookConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'output' && <OutputConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
      </div>
    </div>
  );
}