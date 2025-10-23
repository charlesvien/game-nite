'use server';

import { revalidatePath } from 'next/cache';
import { getGameServerService, getGameCatalogService } from '@/lib/di/container';
import {
  RailwayError,
  ServiceCreationError,
  TemplateNotFoundError,
} from '@/lib/errors/railway-errors';

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface SerializedService {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt?: string;
  deploymentStatus?: string;
  statusUpdatedAt?: string;
  source?: {
    image?: string;
    repo?: string;
  };
}

export async function listServersAction(
  gameId: string,
): Promise<ActionResult<SerializedService[]>> {
  try {
    const gameServer = getGameServerService();
    const services = await gameServer.listServers(gameId);

    const serializedServices = services.map((service) => ({
      id: service.id,
      name: service.name,
      projectId: service.projectId,
      projectName: service.projectName,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt?.toISOString(),
      deploymentStatus: service.deploymentStatus,
      statusUpdatedAt: service.statusUpdatedAt?.toISOString(),
      source: service.source,
    }));

    return {
      success: true,
      data: serializedServices,
    };
  } catch (error) {
    console.error('[listServersAction] Error:', error);
    if (error instanceof RailwayError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch servers' };
  }
}

export async function createServerAction(
  gameId: string,
  serverName: string,
): Promise<ActionResult<{ workflowId: string }>> {
  try {
    const gameCatalog = getGameCatalogService();
    const gameServer = getGameServerService();

    const game = gameCatalog.getGameById(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const workflowId: string = await gameServer.deployTemplate(game, serverName);

    revalidatePath(`/game/${gameId}`);

    return {
      success: true,
      data: {
        workflowId: workflowId,
      },
    };
  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return { success: false, error: 'Template not configured for this game' };
    }
    if (error instanceof ServiceCreationError) {
      return { success: false, error: error.message };
    }
    if (error instanceof RailwayError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function restartServerAction(
  serviceId: string,
  gameId: string,
): Promise<ActionResult> {
  try {
    const gameServer = getGameServerService();
    await gameServer.restartServer(serviceId);

    revalidatePath(`/game/${gameId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof RailwayError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to restart server' };
  }
}

export async function deleteServerAction(
  serviceId: string,
  gameId: string,
): Promise<ActionResult> {
  try {
    const gameServer = getGameServerService();
    await gameServer.deleteServer(serviceId);

    revalidatePath(`/game/${gameId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof RailwayError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete server' };
  }
}

export async function getWorkflowStatusAction(
  workflowId: string,
): Promise<ActionResult<{ status: string; error: string }>> {
  try {
    const gameServer = getGameServerService();
    const workflowStatus = await gameServer.getWorkflowStatus(workflowId);

    return {
      success: true,
      data: workflowStatus,
    };
  } catch (error) {
    if (error instanceof RailwayError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch workflow status' };
  }
}
