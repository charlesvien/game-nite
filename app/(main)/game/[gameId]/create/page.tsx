import { notFound } from 'next/navigation';
import { getGameConfig } from '@/lib/games';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CreateServerForm from './_components/create-server-form';
import Footer from '@/components/footer';

interface PageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default async function CreateServerPage({ params }: PageProps) {
  const { gameId } = await params;
  const game = getGameConfig(gameId);

  if (!game) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/game/${gameId}`}
            className="inline-flex items-center text-lg text-slate-300 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to {game.name}
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Create {game.name} Server
            </h1>
            <p className="text-slate-400">Deploy a new {game.name} server on Railway</p>
          </div>

          <CreateServerForm gameId={gameId} />

          <Footer />
        </div>
      </div>
    </main>
  );
}
