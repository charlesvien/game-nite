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
import {
  restartServerAction,
  deleteServerAction,
  SerializedService,
} from '@/actions/game-server.actions';
import Link from 'next/link';

interface GameInstanceCardProps {
  service: SerializedService;
  gameId: string;
}

export default function GameInstanceCard({ service, gameId }: GameInstanceCardProps) {
  const router = useRouter();
  const [isRestarting, setIsRestarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionStartTime, setDeletionStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const isTransitionalState =
      service.deploymentStatus &&
      ['BUILDING', 'DEPLOYING', 'INITIALIZING'].includes(
        service.deploymentStatus.toUpperCase(),
      );

    if (!isTransitionalState && !isDeleting) {
      return;
    }

    const displayInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(displayInterval);
  }, [service.deploymentStatus, isDeleting]);

  useEffect(() => {
    const isTransitionalState =
      service.deploymentStatus &&
      ['BUILDING', 'DEPLOYING', 'INITIALIZING'].includes(
        service.deploymentStatus.toUpperCase(),
      );

    if (!isTransitionalState && !isDeleting) {
      return;
    }

    const dataInterval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(dataInterval);
  }, [service.deploymentStatus, isDeleting, router]);

  function getStatusDisplay(
    deploymentStatus?: string,
    statusUpdatedAt?: string,
    now: number = Date.now(),
    deletingState: boolean = false,
    deletingStartTime: number | null = null,
  ): { label: string; color: string } {
    if (deletingState && deletingStartTime) {
      const elapsed = Math.floor((now - deletingStartTime) / 1000);
      if (elapsed < 0) {
        return { label: 'Deleting (0:00)', color: 'bg-red-500 animate-pulse' };
      }
      const min = Math.floor(elapsed / 60);
      const sec = elapsed % 60;
      const timeStr = ` (${min}:${sec.toString().padStart(2, '0')})`;
      return { label: `Deleting${timeStr}`, color: 'bg-red-500 animate-pulse' };
    }

    if (!deploymentStatus) {
      return { label: 'Unknown', color: 'bg-gray-500' };
    }
    const upper = deploymentStatus.toUpperCase();
    if (['BUILDING', 'DEPLOYING', 'INITIALIZING'].includes(upper)) {
      let elapsed = 0;
      if (statusUpdatedAt) {
        const date = new Date(statusUpdatedAt);
        if (!isNaN(date.getTime())) {
          elapsed = Math.floor((now - date.getTime()) / 1000);
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
      const result = await restartServerAction(service.id, gameId);
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

    const now = Date.now();
    setIsDeleting(true);
    setDeletionStartTime(now);
    setCurrentTime(now);
    try {
      const result = await deleteServerAction(service.id, gameId);
      if (result.success) {
        toast.success('Server has been deleted');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete server');
        setIsDeleting(false);
        setDeletionStartTime(null);
      }
    } catch {
      toast.error('Failed to delete server');
      setIsDeleting(false);
      setDeletionStartTime(null);
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
              disabled={isDeleting}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleRestart}
              disabled={isRestarting || isDeleting}
            >
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
            <div
              className={`h-2 w-2 rounded-full ${getStatusDisplay(service.deploymentStatus, service.statusUpdatedAt, currentTime, isDeleting, deletionStartTime).color}`}
            />
            <span className="text-slate-300">
              {
                getStatusDisplay(
                  service.deploymentStatus,
                  service.statusUpdatedAt,
                  currentTime,
                  isDeleting,
                  deletionStartTime,
                ).label
              }
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Created {new Date(service.createdAt).toLocaleDateString()}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleCopyLink}
            disabled={isDeleting}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          {isDeleting ? (
            <Button
              disabled
              className="bg-slate-700 text-white border-0 opacity-50 cursor-not-allowed"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
          ) : (
            <Button
              asChild
              className="bg-slate-700 hover:bg-slate-600 text-white border-0"
            >
              <Link
                href={`/share/${service.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
