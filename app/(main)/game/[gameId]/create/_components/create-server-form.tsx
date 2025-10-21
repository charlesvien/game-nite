'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';

interface CreateServerFormProps {
  gameId: string;
}

export default function CreateServerForm({ gameId }: CreateServerFormProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [serverName, setServerName] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!serverName.trim()) {
      toast.error('Please enter a server name');
      return;
    }

    setIsCreating(true);
    try {
      const { createServerAction } = await import('@/actions/game-server.actions');
      const result = await createServerAction(gameId, serverName);

      if (result.success) {
        toast.success('Server created successfully!');
        router.push(`/game/${gameId}`);
      } else {
        toast.error(result.error || 'Failed to create server');
      }
    } catch {
      toast.error('Failed to create server');
    } finally {
      setIsCreating(false);
    }
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
              Creating...
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
