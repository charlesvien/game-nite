import { RailwayServiceModel, TcpProxy } from '../domain/service';

export interface ServiceSource {
  image?: string;
  repo?: string;
}

export interface DeployTemplateOptions {
  serviceName: string;
  source: ServiceSource;
  tcpProxyApplicationPort: number;
  variables?: Record<string, string>;
  volumeMountPath?: string;
}

export interface IRailwayServiceReader {
  getServices(): Promise<RailwayServiceModel[]>;
  getServiceById(serviceId: string): Promise<RailwayServiceModel | null>;
  getTcpProxies(environmentId: string, serviceId: string): Promise<TcpProxy[]>;
  getWorkflowStatus(workflowId: string): Promise<{ status: string; error: string }>;
}

export interface IRailwayServiceWriter {
  deployTemplate(options: DeployTemplateOptions): Promise<string>;
  deleteService(serviceId: string): Promise<void>;
  restartService(serviceId: string): Promise<void>;
}

export interface IRailwayRepository
  extends IRailwayServiceReader,
    IRailwayServiceWriter {}
