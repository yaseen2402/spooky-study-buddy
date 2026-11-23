import type { Metadata, Viewport } from 'next';
import { Creepster, Inter } from 'next/font/google';
import './globals.css';

const display = Creepster({ subsets: ['latin'], weight: '400', variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: 'Spooky Study Buddy',
  description: 'A Pomodoro timer with a ghost that haunts you when you slack off.',
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
};

export const viewport: Viewport = { themeColor: '#0b0a10' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-crypt-950 font-body text-bone antialiased">{children}</body>
    </html>
  );
}
