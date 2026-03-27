'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Locale = 'en' | 'zh';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: Record<string, any>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem('preferred_locale') as Locale;
    if (stored && ['en', 'zh'].includes(stored)) {
      setLocaleState(stored);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Load translations when locale changes
    async function loadTranslations(loc: Locale) {
      try {
        const messages = await import(`../messages/${loc}.json`);
        setTranslations(messages.default || messages);
      } catch (error) {
        console.error(`Failed to load ${loc} translations:`, error);
      }
    }
    if (isInitialized) {
      loadTranslations(locale);
    }
  }, [locale, isInitialized]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('preferred_locale', newLocale);
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, translations }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Simple translation hook that works with the locale context
export function useTranslation(namespace?: string) {
  const { translations, locale } = useLocale();

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return { t, locale };
}
