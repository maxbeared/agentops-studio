'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.auth
        .me()
        .then((data) => {
          setUser(data.user);
          setOrganization(data.organization || null);
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    setUser(data.user);
    setOrganization(data.organization || null);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const data = await api.auth.register({ email, password, name });
    setUser(data.user);
    setOrganization(data.organization || null);
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
    setOrganization(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await api.auth.me();
    setUser(data.user);
    setOrganization(data.organization || null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
