import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import type { IRailwayRepository } from '../repositories/railway.repository.interface';
import { Game } from '../domain/game';
import { RailwayServiceModel } from '../domain/service';
import { TemplateNotFoundError, ServiceCreationError } from '../errors/railway-errors';
import { getGameCatalogService } from '../di/container';

@injectable()
export class GameServerService {
  constructor(@inject(TYPES.IRailwayRepository) private readonly railwayRepository: IRailwayRepository) {}

  async listServers(gameId: string): Promise<RailwayServiceModel[]> {
    const allServices = await this.railwayRepository.getServices();

    const gameCatalog = getGameCatalogService();
    const game = gameCatalog.getGameById(gameId);

    if (!game) {
      return [];
    }

    const filtered = allServices.filter((service) =>
      service.imageName === game.dockerImage
    );

    return filtered;
  }

  async createServer(game: Game, serverName: string): Promise<RailwayServiceModel> {
    if (!game.canDeploy()) {
      throw new TemplateNotFoundError(game.id);
    }

    try {
      return await this.railwayRepository.createService({
        name: serverName,
        variables: game.getEnvironmentVariablesWithPort(),
        source: {
          image: game.dockerImage,
        },
        tcpProxyApplicationPort: game.defaultPort,
        volumeMountPath: game.volumeMountPath,
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
}
