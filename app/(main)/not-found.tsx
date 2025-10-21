import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Gamepad2 className="h-16 w-16 text-purple-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">404 - Page Not Found</h1>
        <p className="text-slate-400 mb-6">The page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
