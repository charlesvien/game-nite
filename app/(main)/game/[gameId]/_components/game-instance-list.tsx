'use client';

import { useEffect, useState, useCallback } from 'react';
import { listServersAction, SerializedService } from '@/actions/game-server.actions';
import { Gamepad2, RefreshCw } from 'lucide-react';
import GameInstanceCard from './game-instance-card';

interface GameInstanceListProps {
  gameId: string;
}

export default function GameInstanceList({ gameId }: GameInstanceListProps) {
  const [gameServices, setGameServices] = useState<SerializedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      const result = await listServersAction(gameId);

      if (!result.success) {
        setError(result.error || 'Failed to fetch servers');
        setIsLoading(false);
        return;
      }

      setGameServices(result.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch servers:', err);
      setError('Failed to fetch servers');
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  function handleServerDeleted(serviceId: string) {
    setGameServices((prev) => prev.filter((s) => s.id !== serviceId));
  }

  useEffect(() => {
    fetchServers();

    const interval = setInterval(() => {
      fetchServers();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchServers]);

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <RefreshCw className="h-16 w-16 text-purple-500 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Loading servers...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <Gamepad2 className="h-16 w-16 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-red-500 mb-2">Error loading servers</h3>
          <p className="text-slate-400 mb-6">{error}</p>
        </div>
      </div>
    );
  }

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
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gameServices.map((service) => (
          <GameInstanceCard
            key={service.id}
            service={service}
            gameId={gameId}
            onDeleted={handleServerDeleted}
          />
        ))}
      </div>
    </div>
  );
}
