import { getGameConfigBySource } from '../games';
import { ServiceSource } from '../repositories/railway.repository.interface';

export interface TcpProxy {
  domain: string;
  proxyPort: number;
  serviceId: string;
}

export class RailwayServiceModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly source: ServiceSource,
    public readonly projectId: string,
    public readonly projectName: string,
    public readonly environmentId: string,
    public readonly createdAt: Date,
    public readonly updatedAt?: Date,
    public readonly deploymentStatus?: string,
    public readonly statusUpdatedAt?: Date,
  ) {}

  getGameType(): string {
    const gameConfig = getGameConfigBySource(this.source);
    return gameConfig?.id || 'game';
  }

  getShareUrl(baseUrl: string): string {
    return `${baseUrl}/share/${this.id}`;
  }

  getStatusDisplay(): { label: string; color: string } {
    if (!this.deploymentStatus) {
      return { label: 'Unknown', color: 'bg-gray-500' };
    }

    switch (this.deploymentStatus.toUpperCase()) {
      case 'SUCCESS':
        return { label: 'Online', color: 'bg-green-500' };
      case 'BUILDING':
      case 'DEPLOYING':
        return { label: 'Deploying', color: 'bg-yellow-500' };
      case 'CRASHED':
      case 'FAILED':
        return { label: 'Crashed', color: 'bg-red-500' };
      case 'REMOVED':
        return { label: 'Removed', color: 'bg-gray-500' };
      default:
        return { label: this.deploymentStatus, color: 'bg-blue-500' };
    }
  }

  static fromRailwayData(data: {
    id: string;
    name: string;
    source: ServiceSource;
    createdAt: string;
    updatedAt: string;
    projectId: string;
    projectName: string;
    environmentId: string;
    deploymentStatus?: string;
    statusUpdatedAt?: Date;
  }): RailwayServiceModel {
    return new RailwayServiceModel(
      data.id,
      data.name,
      data.source,
      data.projectId,
      data.projectName,
      data.environmentId,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.deploymentStatus,
      data.statusUpdatedAt ? new Date(data.statusUpdatedAt) : undefined,
    );
  }
}
