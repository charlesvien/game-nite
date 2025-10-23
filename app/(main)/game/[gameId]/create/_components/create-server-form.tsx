'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { createServerAction, listServersAction } from '@/actions/game-server.actions';
import { GameConfig } from '@/lib/games';

interface CreateServerFormProps {
  gameId: string;
  game: GameConfig;
}

export default function CreateServerForm({ gameId, game }: CreateServerFormProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [creationStartTime, setCreationStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [serverName, setServerName] = useState('');
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>(() => {
    const vars: Record<string, string> = {};
    game.environmentVariables?.forEach((envVar) => {
      vars[envVar.key] = envVar.value;
    });
    return vars;
  });

  // Refs to track polling and prevent race conditions when creating multiple servers
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentServerNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isCreating) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isCreating]);

  // Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!serverName.trim()) {
      toast.error('Please enter a server name');
      return;
    }

    // Clear any existing polling interval before starting a new one
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    const now = Date.now();
    setIsCreating(true);
    setCreationStartTime(now);
    setCurrentTime(now);

    // Track which server we're currently creating
    currentServerNameRef.current = serverName;

    try {
      const result = await createServerAction(gameId, serverName, envVars);

      if (!result.success || !result.data?.workflowId) {
        toast.error(result.error || 'Failed to create server');
        setIsCreating(false);
        setCreationStartTime(null);
        currentServerNameRef.current = null;
        return;
      }

      pollIntervalRef.current = setInterval(async () => {
        try {
          const listResult = await listServersAction(gameId);

          if (!listResult.success) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            toast.error(listResult.error || 'Failed to check server status');
            setIsCreating(false);
            setCreationStartTime(null);
            currentServerNameRef.current = null;
            return;
          }

          const servers = listResult.data || [];
          const serverExists = servers.some((service) => service.name === currentServerNameRef.current);

          // Only redirect if this is still the server we're waiting for
          if (serverExists && currentServerNameRef.current === serverName) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            toast.success('Server created successfully!');
            setIsCreating(false);
            setCreationStartTime(null);
            currentServerNameRef.current = null;
            router.push(`/game/${gameId}`);
          }
        } catch {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          toast.error('Failed to check server status');
          setIsCreating(false);
          setCreationStartTime(null);
          currentServerNameRef.current = null;
        }
      }, 3000);
    } catch {
      toast.error('Failed to create server');
      setIsCreating(false);
      setCreationStartTime(null);
      currentServerNameRef.current = null;
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

        {game.environmentVariables && game.environmentVariables.length > 0 && (
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEnvVars(!showEnvVars)}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-between transition-colors"
            >
              <span className="font-medium">Environment Variables (Optional)</span>
              {showEnvVars ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {showEnvVars && (
              <div className="p-4 space-y-4 bg-slate-900">
                {game.environmentVariables.map((envVar) => (
                  <div key={envVar.key}>
                    <label
                      htmlFor={envVar.key}
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      {envVar.key}
                      {envVar.description && (
                        <span className="text-slate-500 font-normal ml-2">
                          - {envVar.description}
                        </span>
                      )}
                    </label>
                    <input
                      id={envVar.key}
                      type="text"
                      value={envVars[envVar.key] || ''}
                      onChange={(e) =>
                        setEnvVars({ ...envVars, [envVar.key]: e.target.value })
                      }
                      placeholder={envVar.value}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isCreating}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
