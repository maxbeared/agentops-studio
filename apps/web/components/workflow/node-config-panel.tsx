'use client';

import { Trash2 } from 'lucide-react';
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
    input: t('editor.nodes.input') || 'Input',
    text: t('editor.nodes.text') || 'Text',
    loop: t('editor.nodes.loop') || 'Loop',
    delay: t('editor.nodes.delay') || 'Delay',
    transform: t('editor.nodes.transform') || 'Transform',
    code: t('editor.nodes.code') || 'Code',
    merge: t('editor.nodes.merge') || 'Merge',
    errorHandler: t('editor.nodes.errorHandler') || 'Error Handler',
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

function InputNodeConfig({ data, onChange, t }: ConfigProps) {
  const fields = data.config?.inputSchema?.fields || [];

  const addField = () => {
    const newField = { name: '', type: 'string', defaultValue: '' };
    onChange({ ...data.config, inputSchema: { fields: [...fields, newField] } });
  };

  const updateField = (index: number, updates: Record<string, any>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange({ ...data.config, inputSchema: { fields: newFields } });
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_: any, i: number) => i !== index);
    onChange({ ...data.config, inputSchema: { fields: newFields } });
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-zinc-400 mb-2">{t('editor.nodeConfig.inputFields')}</div>
      {fields.map((field: any, index: number) => (
        <div key={index} className="flex gap-2 items-start p-2 bg-zinc-800/50 rounded-lg">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              value={field.name}
              onChange={(e) => updateField(index, { name: e.target.value })}
              placeholder="Field name"
              className="w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-xs text-white"
            />
            <select
              value={field.type}
              onChange={(e) => updateField(index, { type: e.target.value })}
              className="w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-xs text-white"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="array">Array</option>
              <option value="object">Object</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => removeField(index)}
            className="text-red-400 hover:text-red-300 p-1"
            aria-label="Remove field"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addField}
        className="w-full rounded border border-dashed border-zinc-600 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-500"
      >
        {t('editor.nodeConfig.addField')}
      </button>
    </div>
  );
}

function TextNodeConfig({ data, onChange, t }: ConfigProps) {
  const operation = data.config?.operation || 'trim';

  const operations = [
    { value: 'trim', label: 'Trim' },
    { value: 'upper', label: 'Uppercase' },
    { value: 'lower', label: 'Lowercase' },
    { value: 'title', label: 'Title Case' },
    { value: 'split', label: 'Split' },
    { value: 'replace', label: 'Replace' },
    { value: 'regex', label: 'Regex Match' },
    { value: 'concat', label: 'Concat' },
    { value: 'length', label: 'Length' },
    { value: 'slice', label: 'Slice' },
  ];

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="text-operation" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.operation')}</label>
        <select
          id="text-operation"
          value={operation}
          onChange={(e) => onChange({ ...data.config, operation: e.target.value })}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          {operations.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="text-value" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.value')}</label>
        <input
          id="text-value"
          type="text"
          value={data.config?.value || ''}
          onChange={(e) => onChange({ ...data.config, value: e.target.value })}
          placeholder="{{input.text}}"
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
      {operation === 'split' && (
        <div>
          <label htmlFor="text-separator" className="block text-xs text-zinc-400 mb-1">Separator</label>
          <input
            id="text-separator"
            type="text"
            value={data.config?.options?.separator || ''}
            onChange={(e) => onChange({ ...data.config, options: { ...data.config?.options, separator: e.target.value } })}
            placeholder=","
            className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      )}
      {operation === 'replace' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="text-search" className="block text-xs text-zinc-400 mb-1">Search</label>
            <input
              id="text-search"
              type="text"
              value={data.config?.options?.search || ''}
              onChange={(e) => onChange({ ...data.config, options: { ...data.config?.options, search: e.target.value } })}
              className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label htmlFor="text-replacement" className="block text-xs text-zinc-400 mb-1">Replacement</label>
            <input
              id="text-replacement"
              type="text"
              value={data.config?.options?.replacement || ''}
              onChange={(e) => onChange({ ...data.config, options: { ...data.config?.options, replacement: e.target.value } })}
              className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-yan-500"
            />
          </div>
        </div>
      )}
      <div className="rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-500">
        <p className="font-medium text-zinc-400 mb-1">{t('editor.nodeConfig.availableVars')}:</p>
        <code className="text-purple-400">{'{{input.field}}'}</code>, <code className="text-purple-400">{'{{prev.node.field}}'}</code>
      </div>
    </div>
  );
}

function LoopNodeConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="loop-items" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.items')}</label>
        <input
          id="loop-items"
          type="text"
          value={Array.isArray(data.config?.items) ? JSON.stringify(data.config.items) : (data.config?.items || '')}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange({ ...data.config, items: parsed });
            } catch {
              onChange({ ...data.config, items: e.target.value });
            }
          }}
          placeholder='{{input.items}} or ["a", "b", "c"]'
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
      <div>
        <label htmlFor="loop-max" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.maxIterations')}</label>
        <input
          id="loop-max"
          type="number"
          min="1"
          max="10000"
          value={data.config?.maxIterations || 100}
          onChange={(e) => onChange({ ...data.config, maxIterations: parseInt(e.target.value, 10) })}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
      <div className="rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-500">
        <p className="font-medium text-zinc-400 mb-1">{t('editor.nodeConfig.loopHint')}:</p>
        <p>Use <code className="text-purple-400">{'{{loop.item}}'}</code> for current item, <code className="text-purple-400">{'{{loop.index}}'}</code> for index</p>
        <p className="mt-1">In Code node: <code className="text-red-400">__loopBreak()</code> to break, <code className="text-red-400">__loopContinue()</code> to skip</p>
      </div>
    </div>
  );
}

function DelayNodeConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="delay-duration" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.duration')}</label>
        <input
          id="delay-duration"
          type="number"
          min="1"
          max="3600"
          value={data.config?.duration || 1}
          onChange={(e) => onChange({ ...data.config, duration: parseInt(e.target.value, 10) })}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
      <div>
        <label htmlFor="delay-unit" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.unit')}</label>
        <select
          id="delay-unit"
          value={data.config?.unit || 'seconds'}
          onChange={(e) => onChange({ ...data.config, unit: e.target.value })}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="milliseconds">{t('editor.nodeConfig.milliseconds')}</option>
          <option value="seconds">{t('editor.nodeConfig.seconds')}</option>
          <option value="minutes">{t('editor.nodeConfig.minutes')}</option>
          <option value="hours">{t('editor.nodeConfig.hours')}</option>
        </select>
      </div>
    </div>
  );
}

function TransformNodeConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="transform-template" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.template')}</label>
        <textarea
          id="transform-template"
          value={data.config?.template || ''}
          onChange={(e) => onChange({ ...data.config, template: e.target.value })}
          placeholder="Hello {{input.name}}, your score is {{prev.llm.score}}"
          rows={4}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white resize-none focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
        />
      </div>
      <div className="rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-500">
        <p className="font-medium text-zinc-400 mb-1">{t('editor.nodeConfig.availableVars')}:</p>
        <ul className="space-y-0.5">
          <li><code className="text-purple-400">{'{{input.field}}'}</code></li>
          <li><code className="text-purple-400">{'{{prev.NodeName.field}}'}</code></li>
          <li><code className="text-purple-400">{'{{outputs.field}}'}</code></li>
          <li><code className="text-purple-400">{'{{state.field}}'}</code></li>
        </ul>
      </div>
    </div>
  );
}

function CodeNodeConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="code-language" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.language')}</label>
        <select
          id="code-language"
          value={data.config?.language || 'javascript'}
          onChange={(e) => onChange({ ...data.config, language: e.target.value })}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="javascript">JavaScript</option>
        </select>
      </div>
      <div>
        <label htmlFor="code-code" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.code')}</label>
        <textarea
          id="code-code"
          value={data.config?.code || ''}
          onChange={(e) => onChange({ ...data.config, code: e.target.value })}
          placeholder="return input.value * 2"
          rows={6}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white resize-none focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
        />
      </div>
      <div className="rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-500">
        <p className="font-medium text-zinc-400 mb-1">{t('editor.nodeConfig.availableVars')}:</p>
        <ul className="space-y-0.5">
          <li><code className="text-purple-400">input</code> - Input data</li>
          <li><code className="text-purple-400">state</code> - Workflow state</li>
          <li><code className="text-purple-400">outputs</code> - All node outputs</li>
          <li><code className="text-purple-400">prev</code> - Previous node output</li>
        </ul>
        <p className="mt-2 font-medium text-zinc-400">Loop control:</p>
        <ul className="space-y-0.5">
          <li><code className="text-red-400">__loopBreak()</code> - Break loop</li>
          <li><code className="text-red-400">__loopContinue()</code> - Skip to next</li>
        </ul>
      </div>
    </div>
  );
}

function MergeNodeConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="merge-strategy" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.strategy')}</label>
        <select
          id="merge-strategy"
          value={data.config?.strategy || 'all'}
          onChange={(e) => onChange({ ...data.config, strategy: e.target.value })}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="all">{t('editor.nodeConfig.strategyAll')}</option>
          <option value="first">{t('editor.nodeConfig.strategyFirst')}</option>
          <option value="last">{t('editor.nodeConfig.strategyLast')}</option>
        </select>
      </div>
      <div className="rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-500">
        <p className="font-medium text-zinc-400 mb-1">{t('editor.nodeConfig.mergeHint')}:</p>
        <p><strong>all:</strong> Returns array of all branch outputs</p>
        <p><strong>first:</strong> Returns first completed branch output</p>
        <p><strong>last:</strong> Returns last completed branch output</p>
      </div>
    </div>
  );
}

function ErrorHandlerNodeConfig({ data, onChange, t }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="eh-fallback" className="block text-xs text-zinc-400 mb-1">{t('editor.nodeConfig.fallbackOutput')}</label>
        <textarea
          id="eh-fallback"
          value={typeof data.config?.fallbackOutput === 'object' ? JSON.stringify(data.config.fallbackOutput) : (data.config?.fallbackOutput || '{}')}
          onChange={(e) => {
            try {
              onChange({ ...data.config, fallbackOutput: JSON.parse(e.target.value) });
            } catch {
              onChange({ ...data.config, fallbackOutput: e.target.value });
            }
          }}
          placeholder='{"error": "handled"}'
          rows={3}
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white resize-none focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="eh-capture"
          type="checkbox"
          checked={data.config?.captureError !== false}
          onChange={(e) => onChange({ ...data.config, captureError: e.target.checked })}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-cyan-500 focus:ring-cyan-500"
        />
        <label htmlFor="eh-capture" className="text-xs text-zinc-400">{t('editor.nodeConfig.captureError')}</label>
      </div>
    </div>
  );
}

export function NodeConfigPanel() {
  const { selectedNode, updateNodeData, deleteNode, selectNode, pushHistory } = useWorkflowEditorStore();
  const { t } = useTranslation();

  if (!selectedNode) return null;

  const handleConfigChange = (config: Record<string, any>) => {
    updateNodeData(selectedNode.id, { config });
  };

  const handleLabelChange = (label: string) => {
    updateNodeData(selectedNode.id, { label });
  };

  const handleDelete = () => {
    pushHistory();
    deleteNode(selectedNode.id);
    selectNode(null);
  };

  const isStartNode = selectedNode.type === 'start';

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3 shrink-0">
        <div>
          <h3 className="font-medium text-white">{getNodeTypeLabel(selectedNode.type ?? '', t)}</h3>
          <p className="text-xs text-zinc-500">{selectedNode.id}</p>
        </div>
        <div className="flex gap-2">
          {!isStartNode && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              aria-label={t('common.delete')}
              icon={<Trash2 className="h-4 w-4" />}
            />
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {!isStartNode && (
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
        )}
        {selectedNode.type === 'llm' && <LLMConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'retrieval' && <RetrievalConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'condition' && <ConditionConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'review' && <ReviewConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'webhook' && <WebhookConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'output' && <OutputConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'input' && <InputNodeConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'text' && <TextNodeConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'loop' && <LoopNodeConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'delay' && <DelayNodeConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'transform' && <TransformNodeConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'code' && <CodeNodeConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'merge' && <MergeNodeConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
        {selectedNode.type === 'errorHandler' && <ErrorHandlerNodeConfig data={selectedNode.data} onChange={handleConfigChange} t={t} />}
      </div>
    </div>
  );
}