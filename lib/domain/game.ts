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

  /**
   * Checks if this game uses Docker image deployment
   */
  usesDockerImage(): boolean {
    return !!this.source.image;
  }

  /**
   * Checks if this game uses repository-based deployment
   */
  usesRepository(): boolean {
    return !!this.source.repo;
  }

  /**
   * Checks if this game requires persistent storage
   */
  requiresVolume(): boolean {
    return !!this.volumeMountPath;
  }

  /**
   * Gets the deployment source identifier (image or repo)
   */
  getSourceIdentifier(): string {
    return this.source.image || this.source.repo || '';
  }

  /**
   * Checks if the provided service source matches this game
   */
  matchesSource(serviceSource: ServiceSource): boolean {
    return (
      (!!this.source.image && serviceSource.image === this.source.image) ||
      (!!this.source.repo && serviceSource.repo === this.source.repo)
    );
  }

  /**
   * Gets all environment variables with custom overrides and port configuration
   */
  getEnvironmentVariablesWithPort(
    customVars?: Record<string, string>,
  ): Record<string, string> {
    const vars: Record<string, string> = {};

    this.environmentVariables?.forEach((envVar) => {
      vars[envVar.key] = envVar.value;
    });

    if (customVars) {
      Object.entries(customVars).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          vars[key] = value;
        }
      });
    }

    if (!vars.PORT) {
      vars.PORT = this.defaultPort.toString();
    }

    return vars;
  }

  /**
   * Validates that all required environment variables are present
   */
  validateEnvironmentVariables(vars: Record<string, string>): {
    valid: boolean;
    missingKeys: string[];
  } {
    const requiredKeys =
      this.environmentVariables
        ?.filter((envVar) => envVar.description?.includes('required'))
        .map((envVar) => envVar.key) || [];

    const missingKeys = requiredKeys.filter((key) => !vars[key]);

    return {
      valid: missingKeys.length === 0,
      missingKeys,
    };
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
