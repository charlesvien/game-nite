import 'reflect-metadata';
import { injectable } from 'inversify';
import { ApolloClient, gql } from '@apollo/client';
import {
  IRailwayRepository,
  DeployTemplateOptions,
} from './railway.repository.interface';
import { RailwayServiceModel, TcpProxy } from '../domain/service';
import { RailwayError } from '../errors/railway-errors';
import { ErrorCodes } from '../constants/error-codes';

// ====================
// Service operations
// ====================

const DEPLOY_TEMPLATE_MUTATION = gql`
  mutation DeployTemplate(
    $serviceId: String!
    $serviceName: String!
    $templateId: String!
    $tcpProxyApplicationPort: Int!
    $environmentId: String!
    $projectId: String!
    $workspaceId: String!
    $variables: EnvironmentVariables!
    $volumeMountPath: String!
    $volumeName: String!
  ) {
    templateDeploy(
      input: {
        services: {
          id: $serviceId
          serviceName: $serviceName
          template: $templateId
          tcpProxyApplicationPort: $tcpProxyApplicationPort
          variables: $variables
          volumes: { mountPath: $volumeMountPath, volumeName: $volumeName }
        }
        environmentId: $environmentId
        projectId: $projectId
        templateCode: $templateId
        workspaceId: $workspaceId
      }
    ) {
      projectId
      workflowId
    }
  }
`;

const DELETE_SERVICE_MUTATION = gql`
  mutation DeleteService($serviceId: String!) {
    serviceDelete(id: $serviceId)
  }
`;

const RESTART_SERVICE_MUTATION = gql`
  mutation RestartService($serviceId: String!, $environmentId: String!) {
    serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
  }
`;

// ====================
// Project operations
// ====================

const GET_PROJECT_QUERY = gql`
  query GetProject($projectId: String!) {
    project(id: $projectId) {
      id
      name
      services {
        edges {
          node {
            id
            name
            createdAt
            updatedAt
            deployments {
              edges {
                node {
                  id
                  environmentId
                  status
                  statusUpdatedAt
                  staticUrl
                  meta
                }
              }
            }
          }
        }
      }
    }
  }
`;

// ====================
// TCP Proxy operations
// ====================

const GET_TCP_PROXIES_QUERY = gql`
  query GetTcpProxies($environmentId: String!, $serviceId: String!) {
    tcpProxies(environmentId: $environmentId, serviceId: $serviceId) {
      domain
      proxyPort
      serviceId
    }
  }
`;

// ====================
// Volume operations
// ====================

const GET_PROJECT_VOLUMES_QUERY = gql`
  query GetProjectVolumes($projectId: String!) {
    project(id: $projectId) {
      volumes {
        edges {
          node {
            volumeInstances {
              edges {
                node {
                  serviceId
                  volumeId
                }
              }
            }
          }
        }
      }
    }
  }
`;

const DELETE_VOLUME_MUTATION = gql`
  mutation DeleteVolume($volumeId: String!) {
    volumeDelete(volumeId: $volumeId)
  }
`;

// ====================
// Workflow operations
// ====================

const GET_WORKFLOW_STATUS_QUERY = gql`
  query GetWorkflowStatus($workflowId: String!) {
    workflowStatus(workflowId: $workflowId) {
      error
      status
    }
  }
`;

@injectable()
export class RailwayRepository implements IRailwayRepository {
  constructor(
    private readonly client: ApolloClient,
    private readonly projectId: string,
    private readonly environmentId: string,
    private readonly workspaceId: string,
  ) {}

  async getServices(): Promise<RailwayServiceModel[]> {
    try {
      type ServiceEdge = {
        node: {
          id: string;
          name: string;
          createdAt: string;
          updatedAt: string;
          deployments: {
            edges: Array<{
              node: {
                status: string;
                statusUpdatedAt: string;
                staticUrl: string;
                meta: Record<string, unknown>;
              };
            }>;
          };
        };
      };

      const { data } = await this.client.query<{
        project: {
          id: string;
          name: string;
          services: {
            edges: Array<ServiceEdge>;
          };
        };
      }>({
        query: GET_PROJECT_QUERY,
        variables: {
          projectId: this.projectId,
          environmentId: this.environmentId,
        },
        fetchPolicy: 'no-cache',
      });

      if (!data?.project) {
        console.error('[RailwayRepository] No project data returned');
        return [];
      }

      return data.project.services.edges.map((edge: ServiceEdge) => {
        const deploymentStatus: string | undefined =
          edge.node.deployments?.edges?.[0]?.node?.status;
        const statusUpdatedAt: string | undefined =
          edge.node.deployments?.edges?.[0]?.node?.statusUpdatedAt;
        const image: string | undefined = edge.node.deployments?.edges?.[0]?.node?.meta
          ?.image as string | undefined;
        const repo: string | undefined = edge.node.deployments?.edges?.[0]?.node?.meta
          ?.repo as string | undefined;

        return RailwayServiceModel.fromRailwayData({
          ...edge.node,
          source: {
            image: image,
            repo: repo,
          },
          projectId: data.project.id,
          projectName: data.project.name,
          environmentId: this.environmentId,
          deploymentStatus: deploymentStatus,
          statusUpdatedAt: statusUpdatedAt,
        });
      });
    } catch (error) {
      console.error('[RailwayRepository] Error fetching services:', error);
      throw new RailwayError(
        `Failed to fetch services: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        ErrorCodes.FETCH_FAILED,
      );
    }
  }

  async getServiceById(serviceId: string): Promise<RailwayServiceModel | null> {
    const services = await this.getServices();
    return services.find((s) => s.id === serviceId) || null;
  }

  async getTcpProxies(environmentId: string, serviceId: string): Promise<TcpProxy[]> {
    try {
      const { data } = await this.client.query<{
        tcpProxies: Array<{
          domain: string;
          serviceId: string;
          proxyPort: number;
        }>;
      }>({
        query: GET_TCP_PROXIES_QUERY,
        variables: {
          environmentId,
          serviceId,
        },
        fetchPolicy: 'no-cache',
      });

      if (!data?.tcpProxies) {
        console.error('[RailwayRepository] No TCP proxies data returned');
        return [];
      }

      return data.tcpProxies;
    } catch (error) {
      console.error('[RailwayRepository] Error fetching TCP proxies:', error);
      throw new RailwayError(
        `Failed to fetch TCP proxies: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        ErrorCodes.FETCH_FAILED,
      );
    }
  }

  async getWorkflowStatus(
    workflowId: string,
  ): Promise<{ status: string; error: string }> {
    try {
      const { data } = await this.client.query<{
        workflowStatus: {
          status: string;
          error: string;
        };
      }>({
        query: GET_WORKFLOW_STATUS_QUERY,
        variables: { workflowId },
        fetchPolicy: 'no-cache',
      });
      return {
        status: data?.workflowStatus?.status || '',
        error: data?.workflowStatus?.error || '',
      };
    } catch (error) {
      console.error('[RailwayRepository] Error fetching workflow status:', error);
      throw new RailwayError(
        `Failed to fetch workflow status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCodes.FETCH_FAILED,
      );
    }
  }

  async deployTemplate(options: DeployTemplateOptions): Promise<string> {
    try {
      const { data } = await this.client.mutate<{
        templateDeploy: {
          projectId: string;
          workflowId: string;
        };
      }>({
        mutation: DEPLOY_TEMPLATE_MUTATION,
        variables: {
          serviceId: options.serviceName,
          serviceName: options.serviceName,
          templateId: options.source.image || options.source.repo,
          tcpProxyApplicationPort: options.tcpProxyApplicationPort,
          environmentId: this.environmentId,
          projectId: this.projectId,
          workspaceId: this.workspaceId,
          variables: options.variables,
          volumeMountPath: options.volumeMountPath,
          volumeName: options.serviceName,
        },
      });

      return data?.templateDeploy?.workflowId || '';
    } catch (error) {
      console.error('[RailwayRepository] Error deploying template:', error);
      throw new RailwayError(
        `Failed to deploy template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCodes.DEPLOY_FAILED,
      );
    }
  }

  async deleteService(serviceId: string): Promise<void> {
    try {
      console.log(`[RailwayRepository] Attempting to delete service ${serviceId}`);

      const result = await this.client.mutate({
        mutation: DELETE_SERVICE_MUTATION,
        variables: { serviceId },
      });
      console.log(`[RailwayRepository] Deleted service ${serviceId}`, result);

      await this.deleteVolumesForService(serviceId);
    } catch (error) {
      console.error('[RailwayRepository] Error deleting service:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new RailwayError(
        `Failed to delete service: ${message}`,
        ErrorCodes.DELETE_FAILED,
      );
    }
  }

  private async deleteVolumesForService(serviceId: string): Promise<void> {
    try {
      const { data } = await this.client.query<{
        project: {
          volumes: {
            edges: Array<{
              node: {
                volumeInstances: {
                  edges: Array<{
                    node: {
                      serviceId: string;
                      volumeId: string;
                    };
                  }>;
                };
              };
            }>;
          };
        };
      }>({
        query: GET_PROJECT_VOLUMES_QUERY,
        variables: { projectId: this.projectId },
        fetchPolicy: 'no-cache',
      });

      const volumes = data?.project?.volumes?.edges || [];
      const volumesToDelete = volumes
        .filter(
          (volumeEdge) =>
            volumeEdge.node.volumeInstances.edges[0]?.node.serviceId === serviceId,
        )
        .map((volumeEdge) => volumeEdge.node.volumeInstances.edges[0].node.volumeId);

      if (volumesToDelete.length === 0) {
        console.log(`[RailwayRepository] No volumes to delete for service ${serviceId}`);
        return;
      }

      console.log(
        `[RailwayRepository] Deleting ${volumesToDelete.length} volumes for service ${serviceId}`,
      );

      // Delete all volumes in parallel (there should only be one volume per service)
      await Promise.allSettled(
        volumesToDelete.map((volumeId) =>
          this.client
            .mutate({
              mutation: DELETE_VOLUME_MUTATION,
              variables: { volumeId },
            })
            .then(() => console.log(`[RailwayRepository] Deleted volume ${volumeId}`))
            .catch((error) =>
              console.error(
                `[RailwayRepository] Failed to delete volume ${volumeId}:`,
                error,
              ),
            ),
        ),
      );
    } catch (error) {
      console.warn('[RailwayRepository] Could not query/delete volumes:', error);
      // Don't throw - volume deletion is best-effort cleanup
    }
  }

  async restartService(serviceId: string): Promise<void> {
    try {
      await this.client.mutate({
        mutation: RESTART_SERVICE_MUTATION,
        variables: {
          serviceId,
          environmentId: this.environmentId,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new RailwayError(
        `Failed to restart service: ${message}`,
        ErrorCodes.RESTART_FAILED,
      );
    }
  }
}
