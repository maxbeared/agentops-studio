'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/auth-context';
import { LogOut, User as UserIcon, Workflow } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { useTranslation } from '../contexts/locale-context';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/projects', label: t('nav.projects') },
    { href: '/workflows', label: t('nav.workflows') },
    { href: '/runs', label: t('nav.runs') },
    { href: '/knowledge', label: t('nav.knowledge') },
    { href: '/prompts', label: t('nav.prompts') },
    { href: '/reviews', label: t('nav.reviews') },
  ];

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-14 items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
                  boxShadow: '0 0 20px rgba(0,229,255,0.4)',
                }}
              >
                <Workflow className="h-4 w-4 text-zinc-950" aria-hidden="true" />
              </div>
              <span style={{ color: '#00e5ff', textShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
                AGENTOPS
              </span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl" aria-label="Main navigation">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-14 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold" aria-label="AgentOps Home">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
                  boxShadow: '0 0 20px rgba(0,229,255,0.4)',
                }}
              >
                <Workflow className="h-4 w-4 text-zinc-950" aria-hidden="true" />
              </div>
              <span style={{ color: '#00e5ff', textShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
                AGENTOPS
              </span>
            </Link>
            {user && (
              <div className="flex gap-1" role="list">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-cyan-300"
                    aria-label={item.label}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-zinc-400" role="status">
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                  <span aria-label={`Logged in as ${user.name}`}>{user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-white"
                  aria-label={t('nav.logout')}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-cyan-300"
                  aria-label={t('nav.signIn')}
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg px-4 py-1.5 text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
                    color: '#0a0a0a',
                    boxShadow: '0 0 15px rgba(0,229,255,0.3)',
                  }}
                  aria-label={t('nav.register')}
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
