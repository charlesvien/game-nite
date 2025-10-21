import 'reflect-metadata';
import { injectable } from 'inversify';
import { Game } from '../domain/game';
import { GAMES } from '../games';

@injectable()
export class GameCatalogService {
  private games: Map<string, Game>;

  constructor() {
    this.games = new Map();
    this.initializeGames();
  }

  private initializeGames(): void {
    Object.values(GAMES).forEach((config) => {
      const game = Game.fromConfig(config);
      this.games.set(game.id, game);
    });
  }

  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }

  getGameById(id: string): Game | null {
    return this.games.get(id) || null;
  }

  deployableGames(): Game[] {
    return this.getAllGames().filter((game) => game.canDeploy());
  }
}
