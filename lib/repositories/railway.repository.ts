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
  mutation ServiceCreate(
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

const UPDATE_SERVICE_MUTATION = gql`
  mutation ServiceUpdate($id: String!, $tcpProxyApplicationPort: Int) {
    serviceUpdate(id: $id, input: { tcpProxyApplicationPort: $tcpProxyApplicationPort })
  }
`;

const DELETE_SERVICE_MUTATION = gql`
  mutation ServiceDelete($id: String!) {
    serviceDelete(id: $id)
  }
`;

const RESTART_SERVICE_MUTATION = gql`
  mutation ServiceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
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
      const { data } = await this.client.mutate<{
        serviceCreate: {
          id: string;
          name: string;
          createdAt: string;
          updatedAt: string;
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

      if (options.tcpProxyApplicationPort) {
        await this.client.mutate({
          mutation: UPDATE_SERVICE_MUTATION,
          variables: {
            id: serviceId,
            tcpProxyApplicationPort: options.tcpProxyApplicationPort,
          },
        });
      }

      return RailwayServiceModel.fromRailwayData({
        ...data.serviceCreate,
        projectId: this.projectId,
        projectName: '',
      });
    } catch (error) {
      if (error instanceof ServiceCreationError) throw error;
      throw new ServiceCreationError(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async upsertVariables(
    serviceId: string,
    variables: Record<string, string>,
  ): Promise<void> {
    try {
      for (const [name, value] of Object.entries(variables)) {
        await this.client.mutate({
          mutation: UPSERT_VARIABLES_MUTATION,
          variables: {
            projectId: this.projectId,
            environmentId: this.environmentId,
            serviceId,
            name,
            value,
          },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new RailwayError(
        `Failed to upsert variables: ${message}`,
        'VARIABLE_UPSERT_FAILED',
      );
    }
  }

  async deleteService(serviceId: string): Promise<void> {
    try {
      await this.client.mutate({
        mutation: DELETE_SERVICE_MUTATION,
        variables: { id: serviceId },
      });
    } catch (error) {
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
