'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { UserPlus, Mail, Lock, User, AlertCircle, Workflow } from 'lucide-react';
import { useTranslation } from '../../../contexts/locale-context';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.register.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.register.passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      await api.auth.register({ email, password, name });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(t('auth.register.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800/50 bg-zinc-900/80 p-8 shadow-xl"
        style={{ boxShadow: '0 0 60px rgba(0,229,255,0.05)' }}
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
                boxShadow: '0 0 30px rgba(0,229,255,0.4)',
              }}
            >
              <Workflow className="h-7 w-7 text-zinc-950" aria-hidden="true" />
            </div>
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: '#00e5ff', textShadow: '0 0 20px rgba(0,229,255,0.3)' }}
          >
            {t('auth.register.title')}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{t('auth.register.subtitle')}</p>
        </div>

        {error && (
          <div
            className="mb-6 flex items-center gap-2 rounded-lg p-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-zinc-400 mb-1.5">
              {t('auth.register.name')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.register.namePlaceholder')}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-zinc-400 mb-1.5">
              {t('auth.register.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.register.emailPlaceholder')}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-zinc-400 mb-1.5">
              {t('auth.register.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.register.passwordPlaceholder')}
                required
                minLength={6}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-zinc-400 mb-1.5">
              {t('auth.register.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
              color: '#0a0a0a',
              boxShadow: '0 0 20px rgba(0,229,255,0.25)',
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 animate-spin" />
                {t('auth.register.registering')}
              </span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {t('auth.register.register')}
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          {t('auth.register.hasAccount')}{' '}
          <Link
            href="/auth/login"
            className="transition-colors hover:text-cyan-400"
            style={{ color: '#00e5ff' }}
          >
            {t('auth.register.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}