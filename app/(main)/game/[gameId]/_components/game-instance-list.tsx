import { listServersAction } from '@/actions/game-server.actions';
import { Gamepad2 } from 'lucide-react';
import GameInstanceCard from './game-instance-card';

interface GameInstanceListProps {
  gameId: string;
}

export default async function GameInstanceList({ gameId }: GameInstanceListProps) {
  const result = await listServersAction(gameId);

  if (!result.success) {
    console.error('Failed to fetch servers:', result.error);
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <Gamepad2 className="h-16 w-16 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-red-500 mb-2">Error loading servers</h3>
          <p className="text-slate-400 mb-6">
            {result.error || 'Failed to fetch servers'}
          </p>
        </div>
      </div>
    );
  }

  const gameServices = result.data || [];

  if (gameServices.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <Gamepad2 className="h-16 w-16 text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Nothing running yet</h3>
          <p className="text-slate-400 mb-6">
            Hit that create button to spin up a {gameId} server
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gameServices.map((service) => (
        <GameInstanceCard key={service.id} service={service} gameId={gameId} />
      ))}
    </div>
  );
}
