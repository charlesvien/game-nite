import 'reflect-metadata';
import { injectable } from 'inversify';
import { ApolloClient, gql } from '@apollo/client';
import { IRailwayRepository, CreateServiceOptions } from './railway.repository.interface';
import { RailwayServiceModel, TcpProxy } from '../domain/service';
import { ServiceCreationError, RailwayError } from '../errors/railway-errors';

// ====================
// Service operations
// ====================

const CREATE_SERVICE_MUTATION = gql`
  mutation CreateService(
    $name: String!
    $projectId: String!
    $environmentId: String!
    $source: ServiceSourceInput
    $variables: EnvironmentVariables
  ) {
    serviceCreate(
      input: {
        name: $name
        projectId: $projectId
        environmentId: $environmentId
        source: $source
        variables: $variables
      }
    ) {
      id
      name
      createdAt
      updatedAt
      project {
        name
      }
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

// ====================
// TCP Proxy operations
// ====================

const CREATE_TCP_PROXY_MUTATION = gql`
  mutation CreateTcpProxy(
    $environmentId: String!
    $serviceId: String!
    $applicationPort: Int!
  ) {
    tcpProxyCreate(
      input: {
        applicationPort: $applicationPort
        environmentId: $environmentId
        serviceId: $serviceId
      }
    ) {
      applicationPort
      domain
      proxyPort
    }
  }
`;

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

const CREATE_VOLUME_MUTATION = gql`
  mutation CreateVolume(
    $environmentId: String!
    $projectId: String!
    $mountPath: String!
    $serviceId: String!
  ) {
    volumeCreate(
      input: {
        environmentId: $environmentId
        projectId: $projectId
        mountPath: $mountPath
        serviceId: $serviceId
      }
    ) {
      id
      name
    }
  }
`;

const DELETE_VOLUME_MUTATION = gql`
  mutation DeleteVolume($volumeId: String!) {
    volumeDelete(volumeId: $volumeId)
  }
`;

@injectable()
export class RailwayRepository implements IRailwayRepository {
  constructor(
    private readonly client: ApolloClient,
    private readonly projectId: string,
    private readonly environmentId: string,
  ) {}

  async getServices(): Promise<RailwayServiceModel[]> {
    try {
      const { data } = await this.client.query<{
        project: {
          id: string;
          name: string;
          services: {
            edges: Array<{
              node: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                deployments: {
                  edges: Array<{
                    node: {
                      status: string;
                      statusUpdatedAt: Date;
                      staticUrl: string;
                      meta: Record<string, unknown>;
                    };
                  }>;
                };
              };
            }>;
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

      return data.project.services.edges.map((edge) => {
        const deploymentStatus: string | undefined =
          edge.node.deployments?.edges?.[0]?.node?.status;
        const statusUpdatedAt: Date | undefined =
          edge.node.deployments?.edges?.[0]?.node?.statusUpdatedAt;
        const imageName: string | undefined = edge.node.deployments?.edges?.[0]?.node
          ?.meta?.image as string | undefined;
        return RailwayServiceModel.fromRailwayData({
          ...edge.node,
          projectId: data.project.id,
          projectName: data.project.name,
          environmentId: this.environmentId,
          deploymentStatus: deploymentStatus,
          statusUpdatedAt: statusUpdatedAt,
          imageName: imageName,
        });
      });
    } catch (error) {
      console.error('[RailwayRepository] Error fetching services:', error);
      throw new RailwayError(
        `Failed to fetch services: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        'FETCH_FAILED',
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
        'FETCH_FAILED',
      );
    }
  }

  async createService(options: CreateServiceOptions): Promise<RailwayServiceModel> {
    try {
      const existingServices = await this.getServices();
      const nameExists = existingServices.some(
        (service) => service.name.toLowerCase() === options.name.toLowerCase(),
      );

      if (nameExists) {
        throw new ServiceCreationError(
          `A service with the name "${options.name}" already exists`,
        );
      }

      console.log(
        '[RailwayRepository] Service name is available, proceeding with creation',
      );

      const { data } = await this.client.mutate<{
        serviceCreate: {
          id: string;
          name: string;
          createdAt: string;
          updatedAt: string;
          project: {
            name: string;
          };
        };
      }>({
        mutation: CREATE_SERVICE_MUTATION,
        variables: {
          name: options.name,
          projectId: this.projectId,
          environmentId: this.environmentId,
          source: options.source,
          variables: options.variables,
        },
      });

      if (!data?.serviceCreate) {
        throw new ServiceCreationError('No data returned from mutation');
      }

      const serviceId = data.serviceCreate.id;
      console.log('[RailwayRepository] Service created successfully:', serviceId);

      if (options.tcpProxyApplicationPort) {
        console.log(
          '[RailwayRepository] Creating TCP proxy with port:',
          options.tcpProxyApplicationPort,
        );
        try {
          await this.client.mutate({
            mutation: CREATE_TCP_PROXY_MUTATION,
            variables: {
              environmentId: this.environmentId,
              serviceId: serviceId,
              applicationPort: options.tcpProxyApplicationPort,
            },
          });
          console.log('[RailwayRepository] TCP proxy created successfully');
        } catch (updateError) {
          console.warn(
            '[RailwayRepository] Could not auto-configure TCP proxy port (may need manual configuration):',
            updateError,
          );
        }
      }

      if (options.volumeMountPath) {
        console.log('[RailwayRepository] Creating volume with:', {
          environmentId: this.environmentId,
          projectId: this.projectId,
          mountPath: options.volumeMountPath,
          serviceId: serviceId,
        });

        try {
          await this.client.mutate({
            mutation: CREATE_VOLUME_MUTATION,
            variables: {
              environmentId: this.environmentId,
              projectId: this.projectId,
              mountPath: options.volumeMountPath,
              serviceId: serviceId,
            },
          });
          console.log('[RailwayRepository] Volume created successfully');
        } catch (volumeError) {
          console.warn(
            '[RailwayRepository] Could not auto-create volume (may need manual configuration):',
            volumeError,
          );
        }
      }

      return RailwayServiceModel.fromRailwayData({
        ...data.serviceCreate,
        projectId: this.projectId,
        projectName: data.serviceCreate.project.name,
        environmentId: this.environmentId,
      });
    } catch (error) {
      console.error('[RailwayRepository] Error in createService:', error);
      if (error instanceof ServiceCreationError) throw error;
      throw new ServiceCreationError(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async deleteService(serviceId: string): Promise<void> {
    try {
      console.log(`[RailwayRepository] Attempting to delete service ${serviceId}`);

      const volumesToDelete: Array<{ volumeId: string; serviceId: string }> = [];
      try {
        const volumesData = await this.client.query<{
          project: {
            id: string;
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
          variables: {
            projectId: this.projectId,
          },
          fetchPolicy: 'no-cache',
        });

        const volumes = volumesData?.data?.project?.volumes?.edges || [];
        console.log('[RailwayRepository] Found volumes for project:', {
          projectId: this.projectId,
          volumes: volumes.length,
        });

        for (const volumeEdge of volumes) {
          const volumeId = volumeEdge.node.volumeInstances.edges[0].node.volumeId;
          const volumeServiceId = volumeEdge.node.volumeInstances.edges[0].node.serviceId;
          if (volumeServiceId === serviceId) {
            volumesToDelete.push({ volumeId, serviceId: volumeServiceId });
          }
        }
        console.log(
          `[RailwayRepository] Found ${volumesToDelete.length} volumes to delete for service ${serviceId}`,
        );
      } catch (volumeQueryError) {
        console.warn('[RailwayRepository] Could not query volumes:', volumeQueryError);
      }

      const result = await this.client.mutate({
        mutation: DELETE_SERVICE_MUTATION,
        variables: { serviceId: serviceId },
      });
      console.log(`[RailwayRepository] Deleted service ${serviceId}`, result);

      if (volumesToDelete.length > 0) {
        console.log(`[RailwayRepository] Deleting ${volumesToDelete.length} volumes`);
        for (const volume of volumesToDelete) {
          try {
            await this.client.mutate({
              mutation: DELETE_VOLUME_MUTATION,
              variables: { volumeId: volume.volumeId },
            });
            console.log(`[RailwayRepository] Deleted volume ${volume.volumeId}`);
          } catch (volumeError) {
            console.error(
              `[RailwayRepository] Failed to delete volume ${volume.volumeId}:`,
              volumeError,
            );
          }
        }
      }
    } catch (error) {
      console.error('[RailwayRepository] Error deleting service:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new RailwayError(`Failed to delete service: ${message}`, 'DELETE_FAILED');
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
      throw new RailwayError(`Failed to restart service: ${message}`, 'RESTART_FAILED');
    }
  }
}
