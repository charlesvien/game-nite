export class RailwayServiceModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly projectId: string,
    public readonly projectName: string,
    public readonly createdAt: Date,
    public readonly updatedAt?: Date,
    public readonly deploymentStatus?: string,
    public readonly statusUpdatedAt?: Date,
    public readonly imageName?: string,
  ) {}

  getGameType(): string {
    return this.name.toLowerCase().split('-')[0] || 'game';
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
    createdAt: string;
    updatedAt: string;
    projectId: string;
    projectName: string;
    deploymentStatus?: string;
    statusUpdatedAt?: Date;
    imageName?: string;
  }): RailwayServiceModel {
    return new RailwayServiceModel(
      data.id,
      data.name,
      data.projectId,
      data.projectName,
      new Date(data.createdAt),
      data.updatedAt ? new Date(data.updatedAt) : undefined,
      data.deploymentStatus,
      data.statusUpdatedAt ? new Date(data.statusUpdatedAt) : undefined,
      data.imageName,
    );
  }
}
