'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { createServerAction, listServersAction } from '@/actions/game-server.actions';

interface CreateServerFormProps {
  gameId: string;
}

export default function CreateServerForm({ gameId }: CreateServerFormProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [creationStartTime, setCreationStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [serverName, setServerName] = useState('');

  useEffect(() => {
    if (!isCreating) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isCreating]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!serverName.trim()) {
      toast.error('Please enter a server name');
      return;
    }

    const now = Date.now();
    setIsCreating(true);
    setCreationStartTime(now);
    setCurrentTime(now);

    try {
      const result = await createServerAction(gameId, serverName);

      if (!result.success || !result.data?.workflowId) {
        toast.error(result.error || 'Failed to create server');
        setIsCreating(false);
        setCreationStartTime(null);
        return;
      }

      const pollInterval = setInterval(async () => {
        try {
          const listResult = await listServersAction(gameId);

          if (!listResult.success) {
            clearInterval(pollInterval);
            toast.error(listResult.error || 'Failed to check server status');
            setIsCreating(false);
            setCreationStartTime(null);
            return;
          }

          const servers = listResult.data || [];
          const serverExists = servers.some((service) => service.name === serverName);

          if (serverExists) {
            clearInterval(pollInterval);
            toast.success('Server created successfully!');
            setIsCreating(false);
            setCreationStartTime(null);
            router.push(`/game/${gameId}`);
          }
        } catch {
          clearInterval(pollInterval);
          toast.error('Failed to check server status');
          setIsCreating(false);
          setCreationStartTime(null);
        }
      }, 3000);
    } catch {
      toast.error('Failed to create server');
      setIsCreating(false);
      setCreationStartTime(null);
    }
  }

  function getCreatingLabel(): string {
    if (!isCreating || !creationStartTime) {
      return 'Creating...';
    }

    const elapsed = Math.floor((currentTime - creationStartTime) / 1000);
    if (elapsed < 0) {
      return 'Creating (0:00)';
    }
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    return `Creating (${min}:${sec.toString().padStart(2, '0')})`;
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="serverName"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Server Name
          </label>
          <input
            id="serverName"
            type="text"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            placeholder={`My ${gameId} server`}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isCreating}
          />
        </div>

        <Button
          type="submit"
          disabled={isCreating}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {getCreatingLabel()}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Server
            </>
          )}
        </Button>

        <div className="text-sm text-slate-400 pt-4 border-t border-slate-700">
          <p className="mb-2">This will deploy a new {gameId} server on Railway with:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-500">
            <li>Automatic deployment and configuration</li>
            <li>Public IP address for connections</li>
            <li>Easy management and restart capabilities</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
