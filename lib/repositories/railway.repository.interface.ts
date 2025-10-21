import { RailwayServiceModel } from '../domain/service';

export interface ServiceSource {
  image?: string;
  repo?: string;
}

export interface CreateServiceOptions {
  name: string;
  source?: ServiceSource;
  variables?: Record<string, string>;
  tcpProxyApplicationPort?: number;
  volumeMountPath?: string;
}

export interface IRailwayServiceReader {
  getServices(): Promise<RailwayServiceModel[]>;
  getServiceById(serviceId: string): Promise<RailwayServiceModel | null>;
}

export interface IRailwayServiceWriter {
  createService(options: CreateServiceOptions): Promise<RailwayServiceModel>;
  deleteService(serviceId: string): Promise<void>;
  restartService(serviceId: string): Promise<void>;
}

export interface IRailwayRepository
  extends IRailwayServiceReader,
    IRailwayServiceWriter {}
