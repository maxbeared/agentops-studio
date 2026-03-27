'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../contexts/auth-context';
import { LocaleProvider } from '../contexts/locale-context';

type Props = {
  children: ReactNode;
};

export default function Providers({ children }: Props) {
  return (
    <LocaleProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LocaleProvider>
  );
}
