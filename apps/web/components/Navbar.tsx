import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/runs', label: 'Runs' },
  { href: '/knowledge', label: 'Knowledge' },
  { href: '/reviews', label: 'Reviews' },
];

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-14 items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-white">
            AgentOps
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}