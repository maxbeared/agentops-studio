const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

export const api = {
  projects: {
    list: () => fetchApi<any[]>('/projects'),
    get: (id: string) => fetchApi<any>(`/projects/${id}`),
    create: (data: { name: string; description?: string; organizationId: string }) =>
      fetchApi<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<any>(`/projects/${id}`, { method: 'DELETE' }),
  },

  workflows: {
    list: (projectId?: string) =>
      fetchApi<any[]>(`/workflows${projectId ? `?projectId=${projectId}` : ''}`),
    get: (id: string) => fetchApi<any>(`/workflows/${id}`),
    create: (data: { projectId: string; name: string; description?: string }) =>
      fetchApi<any>('/workflows', { method: 'POST', body: JSON.stringify(data) }),
    publish: (id: string, definition: { nodes: any[]; edges: any[] }) =>
      fetchApi<any>(`/workflows/${id}/publish`, { method: 'POST', body: JSON.stringify({ workflowId: id, definition }) }),
  },

  runs: {
    list: (projectId?: string) =>
      fetchApi<any[]>(`/runs${projectId ? `?projectId=${projectId}` : ''}`),
    get: (id: string) => fetchApi<any>(`/runs/${id}`),
    create: (data: { workflowVersionId: string; inputPayload?: Record<string, any> }) =>
      fetchApi<any>('/runs', { method: 'POST', body: JSON.stringify(data) }),
    getNodes: (id: string) => fetchApi<any>(`/runs/${id}/nodes`),
  },

  knowledge: {
    list: (projectId?: string) =>
      fetchApi<any[]>(`/knowledge${projectId ? `?projectId=${projectId}` : ''}`),
    get: (id: string) => fetchApi<any>(`/knowledge/${id}`),
    create: (data: { projectId: string; title: string; sourceType: string; sourceUrl?: string; mimeType?: string }) =>
      fetchApi<any>('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
  },

  reviews: {
    list: (status?: string) =>
      fetchApi<any[]>(`/reviews${status ? `?status=${status}` : ''}`),
    get: (id: string) => fetchApi<any>(`/reviews/${id}`),
  },

  dashboard: {
    stats: (projectId?: string) =>
      fetchApi<any>(`/dashboard/stats${projectId ? `?projectId=${projectId}` : ''}`),
  },
};