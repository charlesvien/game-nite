import 'reflect-metadata';
import { injectable } from 'inversify';
import { ApolloClient, gql } from '@apollo/client';
import { IRailwayRepository, CreateServiceOptions } from './railway.repository.interface';
import { RailwayServiceModel } from '../domain/service';
import { ServiceCreationError, RailwayError } from '../errors/railway-errors';

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

const UPSERT_VARIABLES_MUTATION = gql`
  mutation VariableUpsert(
    $projectId: String!
    $environmentId: String!
    $serviceId: String!
    $name: String!
    $value: String!
  ) {
    variableUpsert(
      input: {
        projectId: $projectId
        environmentId: $environmentId
        serviceId: $serviceId
        name: $name
        value: $value
      }
    )
  }
`;

const CREATE_TCP_PROXY_MUTATION = gql`
  mutation CreateTcpProxy(
    $environmentId: String!,
    $serviceId: String!,
    $applicationPort: Int!
  ) {
    tcpProxyCreate(input: {
      applicationPort: $applicationPort, 
      environmentId: $environmentId, 
      serviceId: $serviceId
    }) {
      applicationPort
      domain
      proxyPort
    }
  }
`;

const CREATE_VOLUME_MUTATION = gql`
  mutation CreateVolume(
    $environmentId: String!,
    $projectId: String!,
    $mountPath: String!,
    $serviceId: String!
  ) {
    volumeCreate(input: {
      environmentId: $environmentId,
      projectId: $projectId,
      mountPath: $mountPath,
      serviceId: $serviceId
    }) {
      id
      name
    }
  }
`;

const GET_SERVICE_VOLUMES_QUERY = gql`
  query GetServiceVolumes($serviceId: String!, $projectId: String!) {
    service(id: $serviceId) {
      id
      volumeInstances(projectId: $projectId) {
        edges {
          node {
            id
            volumeId
          }
        }
      }
    }
  }
`;

const DELETE_VOLUME_MUTATION = gql`
  mutation DeleteVolume($id: String!) {
    volumeDelete(id: $id)
  }
`;

const DELETE_SERVICE_MUTATION = gql`
  mutation DeleteService($id: String!) {
    serviceDelete(id: $id)
  }
`;

const RESTART_SERVICE_MUTATION = gql`
  mutation RestartService($serviceId: String!, $environmentId: String!) {
    serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
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
        },
        fetchPolicy: 'no-cache',
      });

      if (!data?.project) {
        console.error('[RailwayRepository] No project data returned');
        return [];
      }

      return data.project.services.edges.map((edge) => {
        const deploymentStatus: string | undefined = edge.node.deployments?.edges?.[0]?.node?.status;
        const statusUpdatedAt: Date | undefined = edge.node.deployments?.edges?.[0]?.node?.statusUpdatedAt;
        const imageName: string | undefined = edge.node.deployments?.edges?.[0]?.node?.meta?.image as string | undefined;
        return RailwayServiceModel.fromRailwayData({
          ...edge.node,
          projectId: data.project.id,
          projectName: data.project.name,
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
        'FETCH_FAILED'
      );
    }
  }

  async getServiceById(serviceId: string): Promise<RailwayServiceModel | null> {
    const services = await this.getServices();
    return services.find((s) => s.id === serviceId) || null;
  }

  async createService(options: CreateServiceOptions): Promise<RailwayServiceModel> {
    try {
      const existingServices = await this.getServices();
      const nameExists = existingServices.some(
        (service) => service.name.toLowerCase() === options.name.toLowerCase()
      );

      if (nameExists) {
        throw new ServiceCreationError(
          `A service with the name "${options.name}" already exists`
        );
      }

      console.log('[RailwayRepository] Service name is available, proceeding with creation');

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
        console.log('[RailwayRepository] Creating TCP proxy with port:', options.tcpProxyApplicationPort);
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
          console.warn('[RailwayRepository] Could not auto-configure TCP proxy port (may need manual configuration):', updateError);
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
          console.warn('[RailwayRepository] Could not auto-create volume (may need manual configuration):', volumeError);
        }
      }

      return RailwayServiceModel.fromRailwayData({
        ...data.serviceCreate,
        projectId: this.projectId,
        projectName: data.serviceCreate.project.name,
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

      try {
        const volumesData = await this.client.query<{
          service: {
            id: string;
            volumeInstances: {
              edges: Array<{
                node: {
                  id: string;
                  volumeId: string;
                };
              }>;
            };
          };
        }>({
          query: GET_SERVICE_VOLUMES_QUERY,
          variables: {
            serviceId,
            projectId: this.projectId,
          },
          fetchPolicy: 'no-cache',
        });

        const volumes = volumesData?.data?.service?.volumeInstances?.edges || [];
        console.log(`[RailwayRepository] Found ${volumes.length} volumes for service ${serviceId}`);

        for (const volumeEdge of volumes) {
          try {
            await this.client.mutate({
              mutation: DELETE_VOLUME_MUTATION,
              variables: { id: volumeEdge.node.volumeId },
            });
            console.log(`[RailwayRepository] Deleted volume ${volumeEdge.node.volumeId}`);
          } catch (volumeError) {
            console.error(`[RailwayRepository] Failed to delete volume ${volumeEdge.node.volumeId}:`, volumeError);
          }
        }
      } catch (volumeQueryError) {
        console.warn(`[RailwayRepository] Could not query/delete volumes, continuing with service deletion:`, volumeQueryError);
      }

      const result = await this.client.mutate({
        mutation: DELETE_SERVICE_MUTATION,
        variables: { id: serviceId },
      });

      console.log(`[RailwayRepository] Deleted service ${serviceId}`, result);
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
