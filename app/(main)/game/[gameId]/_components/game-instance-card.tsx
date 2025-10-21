'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Link as LinkIcon,
  MoreVertical,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { restartServerAction, deleteServerAction, SerializedService } from '@/actions/game-server.actions';
import Link from 'next/link';

interface GameInstanceCardProps {
  service: SerializedService;
  gameId: string;
}

export default function GameInstanceCard({ service }: GameInstanceCardProps) {
  const router = useRouter();
  const [isRestarting, setIsRestarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const isTransitionalState = service.deploymentStatus &&
      ['BUILDING', 'DEPLOYING', 'INITIALIZING'].includes(service.deploymentStatus.toUpperCase());

    if (!isTransitionalState) {
      return;
    }

    const displayInterval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 1000);

    return () => clearInterval(displayInterval);
  }, [service.deploymentStatus]);

  useEffect(() => {
    const isTransitionalState = service.deploymentStatus &&
      ['BUILDING', 'DEPLOYING', 'INITIALIZING'].includes(service.deploymentStatus.toUpperCase());

    if (!isTransitionalState) {
      return;
    }

    const dataInterval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(dataInterval);
  }, [service.deploymentStatus, router]);

  function getStatusDisplay(
    deploymentStatus?: string,
    statusUpdatedAt?: string
  ): { label: string; color: string } {
    if (!deploymentStatus) {
      return { label: 'Unknown', color: 'bg-gray-500' };
    }
    const upper = deploymentStatus.toUpperCase();
    if (['BUILDING', 'DEPLOYING', 'INITIALIZING'].includes(upper)) {
      let elapsed = 0;
      if (statusUpdatedAt) {
        const date = new Date(statusUpdatedAt);
        if (!isNaN(date.getTime())) {
          elapsed = Math.floor((Date.now() - date.getTime()) / 1000);
        }
      }
      const min = Math.floor(elapsed / 60);
      const sec = elapsed % 60;
      const timeStr = ` (${min}:${sec.toString().padStart(2, '0')})`;
      return { label: `Deploying${timeStr}`, color: 'bg-yellow-500' };
    }
    switch (upper) {
      case 'SUCCESS':
        return { label: 'Online', color: 'bg-green-500' };
      case 'CRASHED':
      case 'FAILED':
        return { label: 'Crashed', color: 'bg-red-500' };
      case 'REMOVED':
        return { label: 'Removed', color: 'bg-gray-500' };
      default:
        return { label: deploymentStatus, color: 'bg-blue-500' };
    }
  }


  async function handleRestart() {
    setIsRestarting(true);
    try {
      const result = await restartServerAction(service.id);
      if (result.success) {
        toast.success('Server restarting...');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to restart server');
      }
    } catch {
      toast.error('Failed to restart server');
    } finally {
      setIsRestarting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this server? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteServerAction(service.id);
      if (result.success) {
        toast.success('Server deleted');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete server');
      }
    } catch {
      toast.error('Failed to delete server');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCopyLink() {
    const shareUrl = `${window.location.origin}/share/${service.id}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard!');
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{service.name}</h3>
          <p className="text-sm text-slate-400">{service.projectName}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleRestart} disabled={isRestarting}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRestarting ? 'animate-spin' : ''}`}
              />
              Restart
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`h-2 w-2 rounded-full ${getStatusDisplay(service.deploymentStatus, service.statusUpdatedAt).color}`} />
            <span className="text-slate-300">{getStatusDisplay(service.deploymentStatus, service.statusUpdatedAt).label}</span>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Created {new Date(service.createdAt).toLocaleDateString()}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleCopyLink}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button asChild className="bg-slate-700 hover:bg-slate-600 text-white border-0">
            <Link href={`/share/${service.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
