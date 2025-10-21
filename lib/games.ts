export interface GameEnvironmentVariable {
  key: string;
  value: string;
  description?: string;
}

export interface GameConfig {
  id: string;
  name: string;
  description: string;
  image: string;
  defaultPort: number;
  dockerImage?: string;
  environmentVariables?: GameEnvironmentVariable[];
  color: string;
  volumeMountPath?: string;
}

export const GAMES: Record<string, GameConfig> = {
  minecraft: {
    id: 'minecraft',
    name: 'Minecraft',
    description: 'Build stuff, mine things',
    image: '/games/minecraft.jpg',
    defaultPort: 25565,
    dockerImage: 'itzg/minecraft-server',
    environmentVariables: [
      { key: 'EULA', value: 'TRUE', description: 'Accept Minecraft EULA' },
      { key: 'TYPE', value: 'PAPER', description: 'Server type' },
      { key: 'VERSION', value: 'LATEST', description: 'Minecraft version' },
    ],
    color: 'bg-green-600',
    volumeMountPath: '/data',
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    description: 'Get raided, rage quit, repeat',
    image: '/games/rust.jpg',
    defaultPort: 28015,
    dockerImage: 'didstopia/rust-server',
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
    color: 'bg-orange-600',
    volumeMountPath: '/steamcmd/rust',
  },
  factorio: {
    id: 'factorio',
    name: 'Factorio',
    description: 'The factory must grow',
    image: '/games/factorio.jpg',
    defaultPort: 34197,
    dockerImage: 'factoriotools/factorio',
    environmentVariables: [
      {
        key: 'FACTORIO_SERVER_NAME',
        value: 'My Factorio Server',
        description: 'Server name',
      },
    ],
    color: 'bg-yellow-600',
    volumeMountPath: '/factorio',
  },
  ark: {
    id: 'ark',
    name: 'ARK: Survival',
    description: 'Tame dinos, die to dinos',
    image: '/games/ark-survival.jpg',
    defaultPort: 7777,
    dockerImage: 'thmhoag/arkserver',
    environmentVariables: [
      { key: 'SESSIONNAME', value: 'My ARK Server', description: 'Server session name' },
      { key: 'SERVERMAP', value: 'TheIsland', description: 'Map name' },
      { key: 'SERVERPASSWORD', value: '', description: 'Server password (optional)' },
      { key: 'ADMINPASSWORD', value: 'admin123', description: 'Admin password' },
      { key: 'MAX_PLAYERS', value: '70', description: 'Max players' },
    ],
    color: 'bg-blue-600',
    volumeMountPath: '/ark',
  },
};

export function getGameConfig(gameId: string): GameConfig | undefined {
  return GAMES[gameId];
}
