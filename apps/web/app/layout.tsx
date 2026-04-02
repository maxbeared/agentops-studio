import './globals.css';
import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import Providers from '../components/providers';

export const metadata: Metadata = {
  title: 'AgentOps Studio',
  description: 'AI workflow platform for modern teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ paddingTop: 'var(--navbar-height, 0px)' }}>
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
