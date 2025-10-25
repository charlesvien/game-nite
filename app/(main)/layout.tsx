import { Inter } from 'next/font/google';
import { UserMenu } from '@/components/user-menu';

const inter = Inter({ subsets: ['latin'] });

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.className}>
      <header className="fixed top-0 right-0 z-50 p-4">
        <UserMenu />
      </header>
      {children}
    </div>
  );
}
