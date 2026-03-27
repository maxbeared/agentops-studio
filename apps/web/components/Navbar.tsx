'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/auth-context';
import { LogOut, User as UserIcon } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { useTranslation } from '../contexts/locale-context';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { href: '/', label: t('nav.dashboard') },
    { href: '/projects', label: t('nav.projects') },
    { href: '/workflows', label: t('nav.workflows') },
    { href: '/runs', label: t('nav.runs') },
    { href: '/knowledge', label: t('nav.knowledge') },
    { href: '/prompts', label: t('nav.prompts') },
    { href: '/reviews', label: t('nav.reviews') },
  ];

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-14 items-center gap-6">
            <Link href="/" className="text-lg font-semibold text-white">
              AgentOps
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm" aria-label="Main navigation">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-14 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold text-white" aria-label="AgentOps Home">
              AgentOps
            </Link>
            {user && (
              <div className="flex gap-1" role="list">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
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
                <div className="flex items-center gap-2 text-sm text-slate-400" role="status">
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                  <span aria-label={`Logged in as ${user.name}`}>{user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
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
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  aria-label={t('nav.signIn')}
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
