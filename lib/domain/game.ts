export interface GameEnvironmentVariable {
  key: string;
  value: string;
  description?: string;
}

export class Game {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly image: string,
    public readonly defaultPort: number,
    public readonly dockerImage: string,
    public readonly environmentVariables: GameEnvironmentVariable[],
    public readonly color: string,
    public readonly volumeMountPath?: string,
  ) {}

  hasDockerImage(): boolean {
    return this.dockerImage.length > 0;
  }

  canDeploy(): boolean {
    return this.hasDockerImage();
  }

  getEnvironmentVariablesWithPort(): Record<string, string> {
    const vars: Record<string, string> = {};

    this.environmentVariables.forEach((envVar) => {
      vars[envVar.key] = envVar.value;
    });

    if (!vars.PORT) {
      vars.PORT = this.defaultPort.toString();
    }

    return vars;
  }

  static fromConfig(config: {
    id: string;
    name: string;
    description: string;
    image: string;
    defaultPort: number;
    dockerImage?: string;
    environmentVariables?: GameEnvironmentVariable[];
    color: string;
    volumeMountPath?: string;
  }): Game {
    return new Game(
      config.id,
      config.name,
      config.description,
      config.image,
      config.defaultPort,
      config.dockerImage || '',
      config.environmentVariables || [],
      config.color,
      config.volumeMountPath,
    );
  }
}
