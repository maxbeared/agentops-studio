'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { useTranslation } from '../../contexts/locale-context';
import {
  Sparkles,
  Send,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workflowData?: {
    name: string;
    description: string;
    definition: {
      nodes: any[];
      edges: any[];
    };
  };
  error?: boolean;
};

export interface AIChatPanelProps {
  workflowId?: string;
  workflowVersionId?: string;
  currentDefinition?: {
    nodes: any[];
    edges: any[];
  };
  selectedNodes?: string[];
  onApplyWorkflow?: (workflow: ChatMessage['workflowData']) => void;
  onClose?: () => void;
}

export function AIChatPanel({
  workflowId,
  workflowVersionId,
  currentDefinition,
  selectedNodes = [],
  onApplyWorkflow,
  onClose,
}: AIChatPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Determine which API to call based on context
      const isModifyMode = workflowId && currentDefinition;

      if (isModifyMode) {
        // Modify workflow
        const response = await fetch('/api/ai/workflows/modify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId,
            workflowVersionId,
            currentDefinition,
            modifications: {
              targetNodes: selectedNodes.length > 0 ? selectedNodes : undefined,
            },
            instruction: input.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to modify workflow');
        }

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.data.explanation || 'Workflow has been modified.',
          timestamp: new Date(),
          workflowData: data.data.modified ? {
            name: 'Modified Workflow',
            description: 'Workflow modified by AI',
            definition: data.data.modified,
          } : undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Generate new workflow
        const response = await fetch('/api/ai/workflows/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: 'default-project', // TODO: Get from context
            description: input.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate workflow');
        }

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.data.explanation || 'I have created a workflow based on your description.',
          timestamp: new Date(),
          workflowData: data.data.workflow,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message || 'Something went wrong'}`,
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApplyWorkflow = (message: ChatMessage) => {
    if (message.workflowData && onApplyWorkflow) {
      onApplyWorkflow(message.workflowData);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <span className="font-semibold text-zinc-100">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Clear chat"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {isExpanded && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-zinc-500 py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-zinc-600" />
                <p className="text-sm">
                  {currentDefinition
                    ? 'Describe how you want to modify this workflow...'
                    : 'Describe the workflow you want to create...'}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                      : message.error
                      ? 'bg-red-500/20 text-red-100 border border-red-500/30'
                      : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  }`}
                >
                  {message.error && (
                    <div className="flex items-center gap-2 mb-2 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Error</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Workflow preview */}
                  {message.workflowData && (
                    <div className="mt-3 pt-3 border-t border-zinc-700">
                      <div className="bg-zinc-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <span className="text-sm font-medium text-green-400">
                            Workflow Generated
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-2">
                          {message.workflowData.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>{message.workflowData.definition.nodes.length} nodes</span>
                          <span>•</span>
                          <span>{message.workflowData.definition.edges.length} edges</span>
                        </div>
                        <button
                          onClick={() => handleApplyWorkflow(message)}
                          className="mt-3 w-full py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium transition-colors"
                        >
                          Apply to Editor
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-zinc-500 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-100 rounded-2xl px-4 py-3 border border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    <span className="text-sm text-zinc-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  currentDefinition
                    ? 'Describe modifications...'
                    : 'Describe the workflow you want to create...'
                }
                rows={2}
                className="flex-1 bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-zinc-700"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-xl font-medium transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>

            {selectedNodes.length > 0 && (
              <p className="text-xs text-zinc-500 mt-2">
                Selected {selectedNodes.length} node(s)
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AIChatPanel;
