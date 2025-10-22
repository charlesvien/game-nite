import { GameConfig, GameEnvironmentVariable } from '../games';
import { ServiceSource } from '../repositories/railway.repository.interface';

export class Game {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly color: string,
    public readonly description: string,
    public readonly source: ServiceSource,
    public readonly defaultPort: number,
    public readonly environmentVariables?: GameEnvironmentVariable[],
    public readonly volumeMountPath?: string,
  ) {}

  get dockerImage(): string | undefined {
    return this.source.image;
  }

  hasDockerImage(): boolean {
    return !!this.source.image;
  }

  canDeploy(): boolean {
    return this.hasDockerImage();
  }

  getEnvironmentVariablesWithPort(): Record<string, string> {
    const vars: Record<string, string> = {};

    this.environmentVariables?.forEach((envVar) => {
      vars[envVar.key] = envVar.value;
    });

    if (!vars.PORT) {
      vars.PORT = this.defaultPort.toString();
    }

    return vars;
  }

  static fromConfig(config: GameConfig): Game {
    return new Game(
      config.id,
      config.name,
      config.color,
      config.description,
      config.source,
      config.defaultPort,
      config.environmentVariables,
      config.volumeMountPath,
    );
  }
}
