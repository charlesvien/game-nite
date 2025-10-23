import { getGameConfigBySource } from '../games';
import { ServiceSource } from '../repositories/railway.repository.interface';
import {
  DeploymentStatus,
  DeploymentStatusDisplay,
} from '../constants/deployment-status';

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

  /**
   * Returns true if the service is currently online and operational
   */
  isOnline(): boolean {
    return this.deploymentStatus?.toUpperCase() === DeploymentStatus.SUCCESS;
  }

  /**
   * Returns true if the service is currently building or deploying
   */
  isDeploying(): boolean {
    const status = this.deploymentStatus?.toUpperCase();
    return status === DeploymentStatus.BUILDING || status === DeploymentStatus.DEPLOYING;
  }

  /**
   * Returns true if the service has crashed or failed
   */
  hasFailed(): boolean {
    const status = this.deploymentStatus?.toUpperCase();
    return status === DeploymentStatus.CRASHED || status === DeploymentStatus.FAILED;
  }

  /**
   * Returns true if the service has been removed
   */
  isRemoved(): boolean {
    return this.deploymentStatus?.toUpperCase() === DeploymentStatus.REMOVED;
  }

  /**
   * Gets the display information for the current deployment status
   */
  getStatusDisplay(): { label: string; color: string } {
    if (!this.deploymentStatus) {
      return { label: 'Unknown', color: 'bg-gray-500' };
    }

    const statusUpper = this.deploymentStatus.toUpperCase() as DeploymentStatus;

    if (statusUpper in DeploymentStatusDisplay) {
      return DeploymentStatusDisplay[statusUpper];
    }

    return { label: this.deploymentStatus, color: 'bg-blue-500' };
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
    statusUpdatedAt?: string;
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
