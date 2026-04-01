const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AuthToken {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMessage = json?.error?.formErrors?.[0] || json?.error?.message || `API error: ${res.status}`;
    throw new Error(errorMessage);
  }

  return json.data as T;
}

function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      fetchApi<AuthToken>('/auth/register', { method: 'POST', body: JSON.stringify(data) }).then((res) => {
        setAuthToken(res.token);
        return res;
      }),
    login: (data: { email: string; password: string }) =>
      fetchApi<AuthToken>('/auth/login', { method: 'POST', body: JSON.stringify(data) }).then((res) => {
        setAuthToken(res.token);
        return res;
      }),
    me: () => fetchApi<AuthToken>('/auth/me'),
    logout: () => clearAuthToken(),
  },

  projects: {
    list: () => fetchApi<any[]>('/projects'),
    get: (id: string) => fetchApi<any>(`/projects/${id}`),
    create: (data: { name: string; description?: string; organizationId?: string }) =>
      fetchApi<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; description?: string | null }) =>
      fetchApi<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
    upload: async (file: File, projectId: string, title: string): Promise<any> => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('title', title);

      const res = await fetch(`${API_BASE}/knowledge/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload error: ${res.status}`);
      }

      const json = await res.json();
      return json.data;
    },
    process: async (id: string): Promise<any> => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE}/knowledge/${id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Process error: ${res.status}`);
      }

      const json = await res.json();
      return json.data;
    },
  },

  reviews: {
    list: (status?: string) =>
      fetchApi<any[]>(`/reviews${status ? `?status=${status}` : ''}`),
    get: (id: string) => fetchApi<any>(`/reviews/${id}`),
    approve: (id: string, comment?: string, output?: Record<string, any>) =>
      fetchApi<any>(`/reviews/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ comment, output }),
      }),
    reject: (id: string, comment?: string) =>
      fetchApi<any>(`/reviews/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
  },

  dashboard: {
    stats: (projectId?: string) =>
      fetchApi<any>(`/dashboard/stats${projectId ? `?projectId=${projectId}` : ''}`),
  },

  prompts: {
    list: (projectId?: string) =>
      fetchApi<any[]>(`/prompts${projectId ? `?projectId=${projectId}` : ''}`),
    get: (id: string) => fetchApi<any>(`/prompts/${id}`),
    create: (data: { projectId: string; name: string; description?: string; template: string; inputSchema?: Record<string, any> }) =>
      fetchApi<any>('/prompts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; description?: string; template?: string; inputSchema?: Record<string, any> }) =>
      fetchApi<any>(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<any>(`/prompts/${id}`, { method: 'DELETE' }),
  },
};