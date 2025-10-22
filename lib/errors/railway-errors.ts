export class RailwayError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'RailwayError';
  }
}

export class ServiceCreationError extends RailwayError {
  constructor(reason: string) {
    super(`Failed to create service: ${reason}`, 'SERVICE_CREATION_FAILED');
    this.name = 'ServiceCreationError';
  }
}

export class TemplateDeploymentError extends RailwayError {
  constructor(reason: string) {
    super(`Failed to deploy template: ${reason}`, 'TEMPLATE_DEPLOYMENT_FAILED');
    this.name = 'TemplateDeploymentError';
  }
}

export class TemplateNotFoundError extends RailwayError {
  constructor(gameId: string) {
    super(`Template not found for game: ${gameId}`, 'TEMPLATE_NOT_FOUND');
    this.name = 'TemplateNotFoundError';
  }
}
