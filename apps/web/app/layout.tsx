import './globals.css';
import type { Metadata } from 'next';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'AgentOps Studio',
  description: 'AI workflow platform for modern teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="pt-14">
          {children}
        </div>
      </body>
    </html>
  );
}
