'use client';

import { useLocale } from '../contexts/locale-context';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
      className="flex items-center gap-2 text-base font-semibold text-zinc-400 transition-all hover:text-cyan-300"
      aria-label={locale === 'en' ? 'Switch to Chinese' : 'Switch to English'}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      <span>{locale === 'en' ? '中文' : 'EN'}</span>
    </button>
  );
}
