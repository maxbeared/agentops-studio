'use client';

import { useState } from 'react';
import { useTranslation } from '../../contexts/locale-context';
import {
  History,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Eye,
  Bot,
  User,
  Clock,
} from 'lucide-react';

export type WorkflowVersionHistory = {
  id: string;
  version: number;
  source: 'manual' | 'ai_generated' | 'ai_modified';
  aiPrompt?: string;
  aiResponse?: Record<string, any>;
  parentVersionId?: string;
  publishedAt?: string;
  createdBy: string;
  createdAt: string;
};

export interface VersionHistoryPanelProps {
  versions: WorkflowVersionHistory[];
  currentVersionId: string;
  onSelectVersion?: (versionId: string) => void;
  onRestoreVersion?: (versionId: string) => void;
}

export function VersionHistoryPanel({
  versions,
  currentVersionId,
  onSelectVersion,
  onRestoreVersion,
}: VersionHistoryPanelProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ai_generated':
        return <Bot className="h-4 w-4 text-cyan-400" />;
      case 'ai_modified':
        return <Bot className="h-4 w-4 text-purple-400" />;
      default:
        return <User className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'ai_generated':
        return t('workflows.version.aiGenerated') || 'AI Generated';
      case 'ai_modified':
        return t('workflows.version.aiModified') || 'AI Modified';
      default:
        return t('workflows.version.manual') || 'Manual';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-zinc-800 bg-zinc-900/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-100">
            {t('workflows.version.title') || 'Version History'}
          </span>
          <span className="text-xs text-zinc-500">
            ({versions.length} {t('workflows.version.versions') || 'versions'})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      {/* Version list */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto">
          {versions
            .sort((a, b) => b.version - a.version)
            .map((version) => (
              <div
                key={version.id}
                className={`px-4 py-3 border-b border-zinc-800/50 transition-colors ${
                  version.id === currentVersionId
                    ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500'
                    : 'hover:bg-zinc-800/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-zinc-100">
                        v{version.version}
                      </span>
                      <div className="flex items-center gap-1">
                        {getSourceIcon(version.source)}
                        <span className="text-xs text-zinc-500">
                          {getSourceLabel(version.source)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-zinc-500 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(version.createdAt)}</span>
                    </div>

                    {version.aiPrompt && (
                      <div className="text-xs text-zinc-400 bg-zinc-800/50 rounded p-2 mb-2 line-clamp-2">
                        <span className="text-zinc-500">Prompt: </span>
                        {version.aiPrompt.slice(0, 100)}
                        {version.aiPrompt.length > 100 ? '...' : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onSelectVersion && (
                      <button
                        onClick={() => onSelectVersion(version.id)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 rounded transition-colors"
                        title={t('workflows.version.view') || 'View'}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {onRestoreVersion && version.id !== currentVersionId && (
                      <button
                        onClick={() => onRestoreVersion(version.id)}
                        className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-700/50 rounded transition-colors"
                        title={t('workflows.version.restore') || 'Restore'}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {version.id === currentVersionId && (
                  <div className="mt-2">
                    <span className="text-xs text-cyan-400 font-medium">
                      {t('workflows.version.current') || 'Current version'}
                    </span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default VersionHistoryPanel;
