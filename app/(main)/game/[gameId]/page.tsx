import { notFound } from 'next/navigation';
import { getGameConfig } from '@/lib/games';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import GameInstanceList from './_components/game-instance-list';
import Footer from '@/components/footer';

interface PageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default async function GamePage({ params }: PageProps) {
  const { gameId } = await params;
  const game = getGameConfig(gameId);

  if (!game) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-lg text-slate-300 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to all games
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{game.name}</h1>
              <p className="text-slate-400">{game.description}</p>
            </div>

            <Link
              href={`/game/${gameId}/create`}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Server
            </Link>
          </div>
        </div>

        <GameInstanceList gameId={gameId} />

        <Footer />
      </div>
    </main>
  );
}
