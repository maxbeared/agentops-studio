'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useLocale } from '../contexts/locale-context';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  locale?: string;
};

export default function I18nProvider({ children, locale = 'en' }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={undefined}>
      {children}
    </NextIntlClientProvider>
  );
}
