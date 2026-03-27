'use client';

import { useLocale } from '../contexts/locale-context';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as 'en' | 'zh')}
          className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-slate-300 cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Select language"
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>
    </div>
  );
}
