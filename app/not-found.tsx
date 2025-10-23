import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Gamepad2 className="h-16 w-16 text-purple-500 mb-6" />
      <h1 className="text-5xl font-bold text-white mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-slate-300 mb-8">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-purple-500 px-6 py-3 text-white font-semibold hover:bg-purple-600 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
