import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import type { IRailwayRepository } from '../repositories/railway.repository.interface';
import { Game } from '../domain/game';
import { RailwayServiceModel } from '../domain/service';
import { TemplateNotFoundError, ServiceCreationError } from '../errors/railway-errors';

@injectable()
export class GameServerService {
  constructor(@inject(TYPES.IRailwayRepository) private readonly railwayRepository: IRailwayRepository) {}

  async listServers(gameId: string): Promise<RailwayServiceModel[]> {
    const allServices = await this.railwayRepository.getServices();
    console.log('[GameServerService] Total services from Railway:', allServices.length);
    console.log('[GameServerService] Services:', allServices.map(s =>
      `{id: ${s.id}, name: ${s.name}, imageName: ${s.imageName}}`
    ));

    const { getGameCatalogService } = await import('../di/container');
    const gameCatalog = getGameCatalogService();
    const game = gameCatalog.getGameById(gameId);

    if (!game) {
      console.log('[GameServerService] Game not found:', gameId);
      return [];
    }

    const filtered = allServices.filter((service) =>
      service.imageName === game.dockerImage
    );
    console.log('[GameServerService] Filtered services for gameId', gameId, 'with image', game.dockerImage, ':', filtered.length);

    return filtered;
  }

  async createServer(game: Game, serverName: string): Promise<RailwayServiceModel> {
    if (!game.canDeploy()) {
      throw new TemplateNotFoundError(game.id);
    }

    const uniqueName = this.generateUniqueName(serverName, game.id);

    try {
      return await this.railwayRepository.createService({
        name: uniqueName,
        variables: game.getEnvironmentVariablesWithPort(),
        tcpProxyApplicationPort: game.defaultPort,
        source: {
          image: game.dockerImage,
        },
      });
    } catch (error) {
      if (error instanceof ServiceCreationError) throw error;
      throw new ServiceCreationError(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async restartServer(serviceId: string): Promise<void> {
    await this.railwayRepository.restartService(serviceId);
  }

  async deleteServer(serviceId: string): Promise<void> {
    await this.railwayRepository.deleteService(serviceId);
  }

  async getServerById(serviceId: string): Promise<RailwayServiceModel | null> {
    return await this.railwayRepository.getServiceById(serviceId);
  }

  private generateUniqueName(baseName: string, gameId: string): string {
    const timestamp = Date.now();
    const sanitizedName = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return `${gameId}-${sanitizedName}-${timestamp}`;
  }
}
