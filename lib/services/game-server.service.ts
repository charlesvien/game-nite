import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import type { IRailwayRepository } from '../repositories/railway.repository.interface';
import { Game } from '../domain/game';
import { RailwayServiceModel } from '../domain/service';
import { TemplateDeploymentError } from '../errors/railway-errors';
import { getGameCatalogService } from '../di/container';

@injectable()
export class GameServerService {
  constructor(
    @inject(TYPES.IRailwayRepository)
    private readonly railwayRepository: IRailwayRepository,
  ) {}

  async listServers(gameId: string): Promise<RailwayServiceModel[]> {
    const allServices = await this.railwayRepository.getServices();

    const gameCatalog = getGameCatalogService();
    const game = gameCatalog.getGameById(gameId);

    if (!game) {
      return [];
    }

    const filtered = allServices.filter(
      (service) => service.source.image === game.source.image,
    );

    return filtered;
  }

  async deployTemplate(
    game: Game,
    serviceName: string,
    customEnvVars?: Record<string, string>,
  ): Promise<string> {
    try {
      return await this.railwayRepository.deployTemplate({
        serviceName: serviceName,
        source: game.source,
        tcpProxyApplicationPort: game.defaultPort,
        variables: game.getEnvironmentVariablesWithPort(customEnvVars),
        volumeMountPath: game.volumeMountPath,
      });
    } catch (error) {
      if (error instanceof TemplateDeploymentError) throw error;
      throw new TemplateDeploymentError(
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

  async getWorkflowStatus(
    workflowId: string,
  ): Promise<{ status: string; error: string }> {
    return await this.railwayRepository.getWorkflowStatus(workflowId);
  }
}
