import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2 } from 'lucide-react';
import { GAMES } from '@/lib/games';
import Footer from '@/components/footer';
import { UserMenu } from '@/components/user-menu';

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="absolute top-4 right-4">
          <UserMenu />
        </div>
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Gamepad2 className="h-12 w-12 text-purple-500 mr-3" />
            <h1 className="text-5xl font-bold text-white">Game Nite</h1>
          </div>
          <p className="text-xl text-slate-300">Pick a game to see what's running</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto">
          {Object.values(GAMES).map((game) => (
            <Link
              key={game.id}
              href={`/game/${game.id}`}
              className="group relative overflow-hidden rounded-lg aspect-[3/4] w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] bg-slate-800 border border-slate-700 hover:border-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="absolute inset-0">
                <Image
                  src={game.image}
                  alt={game.name}
                  fill
                  className="object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              </div>

              <div className="relative h-full flex flex-col justify-end p-6">
                <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  {game.name}
                </h2>

                <p className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  {game.description}
                </p>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Manage →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Footer />
      </div>
    </main>
  );
}
