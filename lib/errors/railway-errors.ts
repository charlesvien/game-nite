export class RailwayError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'RailwayError';
  }
}

export class ServiceNotFoundError extends RailwayError {
  constructor(serviceId: string) {
    super(`Service with ID ${serviceId} not found`, 'SERVICE_NOT_FOUND');
    this.name = 'ServiceNotFoundError';
  }
}

export class ServiceCreationError extends RailwayError {
  constructor(reason: string) {
    super(`Failed to create service: ${reason}`, 'SERVICE_CREATION_FAILED');
    this.name = 'ServiceCreationError';
  }
}

export class TemplateNotFoundError extends RailwayError {
  constructor(gameId: string) {
    super(`Template not found for game: ${gameId}`, 'TEMPLATE_NOT_FOUND');
    this.name = 'TemplateNotFoundError';
  }
}

export class AuthenticationError extends RailwayError {
  constructor() {
    super('Railway API authentication failed', 'AUTHENTICATION_FAILED');
    this.name = 'AuthenticationError';
  }
}
