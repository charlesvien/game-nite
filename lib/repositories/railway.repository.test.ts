import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RailwayRepository } from './railway.repository';
import { ApolloClient } from '@apollo/client';

const createMockApolloClient = () => {
  const mockClient = {
    query: vi.fn(),
    mutate: vi.fn(),
  };
  return mockClient as typeof mockClient & ApolloClient;
};

describe('RailwayRepository', () => {
  let repository: RailwayRepository;
  let mockClient: ReturnType<typeof createMockApolloClient>;
  const mockProjectId = 'test-project-id';
  const mockEnvironmentId = 'test-environment-id';
  const mockWorkspaceId = 'test-workspace-id';

  beforeEach(() => {
    mockClient = createMockApolloClient();
    repository = new RailwayRepository(
      mockClient,
      mockProjectId,
      mockEnvironmentId,
      mockWorkspaceId,
    );
  });

  describe('deleteService', () => {
    const mockServiceId = 'test-service-id';

    it('should query volumes before deleting the service', async () => {
      const mockVolumesData = {
        data: {
          project: {
            volumes: {
              edges: [
                {
                  node: {
                    volumeInstances: {
                      edges: [
                        {
                          node: {
                            serviceId: mockServiceId,
                            volumeId: 'volume-1',
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      };

      mockClient.query.mockResolvedValueOnce(mockVolumesData);
      mockClient.mutate.mockResolvedValue({ data: { serviceDelete: true } });

      await repository.deleteService(mockServiceId);

      // Should query volumes first
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { projectId: mockProjectId },
          fetchPolicy: 'no-cache',
        }),
      );

      // Then delete service
      expect(mockClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { serviceId: mockServiceId },
        }),
      );
    });

    it('should delete all volumes with matching serviceId', async () => {
      const mockVolumesData = {
        data: {
          project: {
            volumes: {
              edges: [
                {
                  node: {
                    volumeInstances: {
                      edges: [
                        {
                          node: {
                            serviceId: mockServiceId,
                            volumeId: 'volume-1',
                          },
                        },
                        {
                          node: {
                            serviceId: mockServiceId,
                            volumeId: 'volume-2',
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  node: {
                    volumeInstances: {
                      edges: [
                        {
                          node: {
                            serviceId: 'other-service',
                            volumeId: 'volume-3',
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      };

      mockClient.query.mockResolvedValueOnce(mockVolumesData);
      mockClient.mutate.mockResolvedValue({ data: {} });

      await repository.deleteService(mockServiceId);

      // Should call mutate 3 times: once for service, twice for volumes
      expect(mockClient.mutate).toHaveBeenCalledTimes(3);

      // Should delete correct volumes (volume-1 and volume-2, not volume-3)
      expect(mockClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { volumeId: 'volume-1' },
        }),
      );
      expect(mockClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { volumeId: 'volume-2' },
        }),
      );
    });

    it('should handle volumes with no matching instances', async () => {
      const mockVolumesData = {
        data: {
          project: {
            volumes: {
              edges: [
                {
                  node: {
                    volumeInstances: {
                      edges: [
                        {
                          node: {
                            serviceId: 'other-service',
                            volumeId: 'volume-1',
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      };

      mockClient.query.mockResolvedValueOnce(mockVolumesData);
      mockClient.mutate.mockResolvedValue({ data: { serviceDelete: true } });

      await repository.deleteService(mockServiceId);

      // Should only call mutate once for service deletion
      expect(mockClient.mutate).toHaveBeenCalledTimes(1);
      expect(mockClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { serviceId: mockServiceId },
        }),
      );
    });

    it('should remove duplicate volume IDs', async () => {
      const mockVolumesData = {
        data: {
          project: {
            volumes: {
              edges: [
                {
                  node: {
                    volumeInstances: {
                      edges: [
                        {
                          node: {
                            serviceId: mockServiceId,
                            volumeId: 'volume-1',
                          },
                        },
                        {
                          node: {
                            serviceId: mockServiceId,
                            volumeId: 'volume-1', // Duplicate
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      };

      mockClient.query.mockResolvedValueOnce(mockVolumesData);
      mockClient.mutate.mockResolvedValue({ data: {} });

      await repository.deleteService(mockServiceId);

      // Should call mutate 2 times: once for service, once for volume (deduped)
      expect(mockClient.mutate).toHaveBeenCalledTimes(2);
    });

    it('should continue deleting service even if volume query fails', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Query failed'));
      mockClient.mutate.mockResolvedValue({ data: { serviceDelete: true } });

      await repository.deleteService(mockServiceId);

      // Should still delete the service
      expect(mockClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { serviceId: mockServiceId },
        }),
      );
    });

    it('should handle empty volume edges', async () => {
      const mockVolumesData = {
        data: {
          project: {
            volumes: {
              edges: [],
            },
          },
        },
      };

      mockClient.query.mockResolvedValueOnce(mockVolumesData);
      mockClient.mutate.mockResolvedValue({ data: { serviceDelete: true } });

      await repository.deleteService(mockServiceId);

      // Should only call mutate once for service deletion
      expect(mockClient.mutate).toHaveBeenCalledTimes(1);
    });
  });
});
