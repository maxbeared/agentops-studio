import { api } from '../../lib/api';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    uploaded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ready: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[status] || colors.uploaded}`}>
      {status}
    </span>
  );
}

function SourceTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    file: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    url: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    text: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[type] || colors.file}`}>
      {type}
    </span>
  );
}

export default async function KnowledgePage() {
  let documents: any[] = [];

  try {
    documents = await api.knowledge.list();
  } catch (e) {
    console.error('Failed to fetch knowledge documents:', e);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="mt-2 text-slate-400">Manage documents for RAG retrieval</p>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No documents uploaded yet.</p>
              <p className="mt-2 text-sm text-slate-500">Upload documents to enable RAG retrieval in your workflows.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{doc.title}</h3>
                      <SourceTypeBadge type={doc.sourceType} />
                      <StatusBadge status={doc.status} />
                    </div>
                    <div className="mt-2 flex gap-4 text-sm text-slate-500">
                      {doc.mimeType && <span>{doc.mimeType}</span>}
                      {doc.sourceUrl && (
                        <a href={doc.sourceUrl} className="text-indigo-400 hover:underline" target="_blank" rel="noopener">
                          {doc.sourceUrl.slice(0, 40)}...
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    v{doc.version} · {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}