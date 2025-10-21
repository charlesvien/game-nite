import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { getClient } from '../apollo-client';
import { RAILWAY_PROJECT_ID, RAILWAY_ENVIRONMENT_ID } from '../env';
import { RailwayRepository } from '../repositories/railway.repository';
import { GameServerService } from '../services/game-server.service';
import { GameCatalogService } from '../services/game-catalog.service';
import { IRailwayRepository } from '../repositories/railway.repository.interface';

const container = new Container();

container.bind<IRailwayRepository>(TYPES.IRailwayRepository).toDynamicValue(() => {
  return new RailwayRepository(getClient(), RAILWAY_PROJECT_ID, RAILWAY_ENVIRONMENT_ID);
}).inSingletonScope();

container.bind<GameCatalogService>(TYPES.GameCatalogService).to(GameCatalogService).inSingletonScope();
container.bind<GameServerService>(TYPES.GameServerService).to(GameServerService).inSingletonScope();

function getGameServerService(): GameServerService {
  return container.get<GameServerService>(TYPES.GameServerService);
}

function getGameCatalogService(): GameCatalogService {
  return container.get<GameCatalogService>(TYPES.GameCatalogService);
}

function getRailwayRepository(): IRailwayRepository {
  return container.get<IRailwayRepository>(TYPES.IRailwayRepository);
}

export { container, getGameServerService, getGameCatalogService, getRailwayRepository };
