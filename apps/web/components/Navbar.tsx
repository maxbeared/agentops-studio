'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/auth-context';
import { LogOut, User as UserIcon } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/runs', label: 'Runs' },
  { href: '/knowledge', label: 'Knowledge' },
  { href: '/prompts', label: 'Prompts' },
  { href: '/reviews', label: 'Reviews' },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();

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
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  aria-label="Sign in to your account"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  aria-label="Register a new account"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
