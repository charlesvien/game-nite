import type { Metadata } from 'next';
import { ToasterClient } from '@/components/toaster-client';
import './globals.css';

export const metadata: Metadata = {
  title: 'Game Nite',
  description: 'One-click game server provisioning',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">
        {children}
        <ToasterClient />
      </body>
    </html>
  );
}
