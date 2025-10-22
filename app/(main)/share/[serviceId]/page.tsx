import { notFound } from 'next/navigation';
import Link from 'next/link';
import CopyButton from './_components/copy-button';
import { getGameConfigBySource } from '@/lib/games';
import { getGameServerService, getRailwayRepository } from '@/lib/di/container';

interface PageProps {
  params: Promise<{
    serviceId: string;
  }>;
}

export default async function SharePage({ params }: PageProps) {
  const { serviceId } = await params;
  const gameServerService = getGameServerService();
  const railwayRepository = getRailwayRepository();

  const foundServer = await gameServerService.getServerById(serviceId);
  if (!foundServer || !foundServer.source) {
    notFound();
  }

  const tcpProxies = await railwayRepository.getTcpProxies(
    foundServer.environmentId,
    serviceId,
  );
  if (!tcpProxies.length) {
    notFound();
  }

  const gameConfig = getGameConfigBySource(foundServer.source);
  if (!gameConfig) {
    notFound();
  }

  const connectionDetails = {
    serverName: foundServer.name,
    game: gameConfig?.name || 'Game Server',
    ip: tcpProxies[0].domain,
    port: tcpProxies[0].proxyPort.toString(),
    password: 'Generated when server starts',
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Join the Server!</h1>
            <p className="text-slate-400 text-sm">
              Follow the instructions below to join the server.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-1">Server Name</div>
              <div className="text-xl font-bold text-white">{foundServer.name}</div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-1">Game</div>
              <div className="text-lg text-white">{connectionDetails.game}</div>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-slate-400">Server Address</div>
                  <CopyButton text={connectionDetails.ip} />
                </div>
                <div className="text-white font-mono text-sm">{connectionDetails.ip}</div>
              </div>

              <div className="bg-slate-900 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-slate-400">Port</div>
                  <CopyButton text={connectionDetails.port} />
                </div>
                <div className="text-white font-mono text-sm">
                  {connectionDetails.port}
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="text-xs text-purple-300">
                <strong>How to connect:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Open {connectionDetails.game} on your device</li>
                  <li>Go to multiplayer or server browser</li>
                  <li>Add a new server with the address above</li>
                  <li>Connect and enjoy!</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              View all servers →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
