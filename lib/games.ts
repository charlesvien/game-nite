import { ServiceSource } from './repositories/railway.repository.interface';

export interface GameEnvironmentVariable {
  key: string;
  value: string;
  description?: string;
}

export interface GameConfig {
  id: string;
  name: string;
  color: string;
  image: string;
  description: string;
  source: ServiceSource;
  defaultPort: number;
  environmentVariables?: GameEnvironmentVariable[];
  volumeMountPath?: string;
}

export const GAMES: Record<string, GameConfig> = {
  minecraft: {
    id: 'minecraft',
    name: 'Minecraft',
    color: 'bg-green-600',
    image: '/games/minecraft.jpg',
    description: 'Build stuff, mine things',
    source: {
      image: 'itzg/minecraft-server',
    },
    environmentVariables: [
      { key: 'EULA', value: 'TRUE', description: 'Accept Minecraft EULA' },
      { key: 'TYPE', value: 'PAPER', description: 'Server type' },
      { key: 'VERSION', value: 'LATEST', description: 'Minecraft version' },
      {
        key: 'MOTD',
        value: 'Server deployed on Railway!',
        description: 'Message of the day',
      },
    ],
    defaultPort: 25565,
    volumeMountPath: '/data',
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    color: 'bg-orange-600',
    image: '/games/rust.jpg',
    description: 'Get raided, rage quit, repeat',
    source: {
      image: 'didstopia/rust-server',
    },
    environmentVariables: [
      {
        key: 'RUST_SERVER_STARTUP_ARGUMENTS',
        value: '-batchmode -load',
        description: 'Server startup args',
      },
      { key: 'RUST_SERVER_IDENTITY', value: 'main', description: 'Server identity' },
      { key: 'RUST_SERVER_SEED', value: '12345', description: 'World seed' },
      { key: 'RUST_SERVER_WORLDSIZE', value: '3500', description: 'World size' },
      { key: 'RUST_SERVER_NAME', value: 'My Rust Server', description: 'Server name' },
      { key: 'RUST_SERVER_MAXPLAYERS', value: '50', description: 'Max players' },
    ],
    defaultPort: 28015,
    volumeMountPath: '/steamcmd/rust',
  },
  factorio: {
    id: 'factorio',
    name: 'Factorio',
    color: 'bg-yellow-600',
    image: '/games/factorio.jpg',
    description: 'The factory must grow',
    source: {
      image: 'factoriotools/factorio',
    },
    environmentVariables: [
      {
        key: 'FACTORIO_SERVER_NAME',
        value: 'My Factorio Server',
        description: 'Server name',
      },
    ],
    defaultPort: 34197,
    volumeMountPath: '/factorio',
  },
};

export function getGameConfig(gameId: string): GameConfig | undefined {
  return GAMES[gameId];
}

export function getGameConfigBySource(source: ServiceSource): GameConfig | undefined {
  return Object.values(GAMES).find(
    (game) =>
      (game.source.image && source.image && game.source.image === source.image) ||
      (game.source.repo && source.repo && game.source.repo === source.repo),
  );
}
