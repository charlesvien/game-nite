export enum DeploymentStatus {
  SUCCESS = 'SUCCESS',
  BUILDING = 'BUILDING',
  DEPLOYING = 'DEPLOYING',
  CRASHED = 'CRASHED',
  FAILED = 'FAILED',
  REMOVED = 'REMOVED',
}

export const DeploymentStatusDisplay: Record<
  DeploymentStatus,
  { label: string; color: string }
> = {
  [DeploymentStatus.SUCCESS]: { label: 'Online', color: 'bg-green-500' },
  [DeploymentStatus.BUILDING]: { label: 'Deploying', color: 'bg-yellow-500' },
  [DeploymentStatus.DEPLOYING]: { label: 'Deploying', color: 'bg-yellow-500' },
  [DeploymentStatus.CRASHED]: { label: 'Crashed', color: 'bg-red-500' },
  [DeploymentStatus.FAILED]: { label: 'Crashed', color: 'bg-red-500' },
  [DeploymentStatus.REMOVED]: { label: 'Removed', color: 'bg-gray-500' },
};
