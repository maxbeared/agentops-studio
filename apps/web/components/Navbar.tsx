'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/auth-context';
import { LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { useTranslation } from '../contexts/locale-context';

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty('--navbar-height', `${nav.offsetHeight}px`);
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(nav);
    window.addEventListener('resize', updateHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);
  const { user, loading, logout } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/projects', label: t('nav.projects') },
    { href: '/workflows', label: t('nav.workflows') },
    { href: '/runs', label: t('nav.runs') },
    { href: '/knowledge', label: t('nav.knowledge') },
    { href: '/prompts', label: t('nav.prompts') },
    { href: '/reviews', label: t('nav.reviews') },
    { href: '/settings', label: t('nav.settings') },
  ];

  if (loading) {
    return (
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between gap-4 py-3">
            <Link href="/" className="text-xl font-bold logo-glow shrink-0">
              <span style={{ color: '#00e5ff', textShadow: '0 0 40px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.25)' }}>
                AGENTOPS
              </span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl" aria-label="Main navigation">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link href="/" className="text-xl font-bold logo-glow shrink-0" aria-label="AgentOps Home">
            <span style={{ color: '#00e5ff', textShadow: '0 0 40px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.25)' }}>
              AGENTOPS
            </span>
          </Link>

          <div className="flex-1 flex justify-center">
            {user && (
              <>
                {/* Desktop nav - hidden on sm screens and below, flex-wrap on larger */}
                <div className="hidden sm:flex gap-1 flex-wrap" role="list">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-lg px-3 py-1.5 text-base text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-cyan-300"
                      aria-label={item.label}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Mobile nav button - shown on sm and below */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-base text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-white"
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  <span>{t('nav.menu')}</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
            {user ? (
              <>
                <div className="hidden lg:flex items-center gap-2 text-base text-zinc-400" role="status">
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                  <span aria-label={`Logged in as ${user.name}`}>{user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-base text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-white"
                  aria-label={t('nav.logout')}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-base text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-cyan-300"
                  aria-label={t('nav.signIn')}
                >
                  <span className="lg:hidden"><LogOut className="h-4 w-4" /></span>
                  <span className="hidden lg:inline">{t('nav.signIn')}</span>
                </Link>
                <Link
                  href="/auth/register"
                  className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-base font-medium transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
                    color: '#0a0a0a',
                    boxShadow: '0 0 15px rgba(0,229,255,0.3)',
                  }}
                  aria-label={t('nav.register')}
                >
                  <span className="hidden lg:inline">{t('nav.register')}</span>
                  <span className="lg:hidden">+</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {user && mobileMenuOpen && (
          <div className="sm:hidden py-3 border-t border-zinc-800/50">
            <div className="flex flex-col gap-1" role="list">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-base text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-cyan-300"
                  aria-label={item.label}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
