import * as k8s from '@kubernetes/client-node';
import { EventEmitter } from 'events';
import { LoggerService } from '../utils/logger';
import { Gateway, HTTPRoute, GatewayStatus, RouteStatus, KubernetesError } from '../../shared/types';
import * as yaml from 'js-yaml';

export interface KubernetesResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: any;
  status?: any;
}

export class KubernetesService extends EventEmitter {
  private k8sApi: k8s.KubernetesApi;
  private coreV1Api: k8s.CoreV1Api;
  private customObjectsApi: k8s.CustomObjectsApi;
  private appsV1Api: k8s.AppsV1Api;
  private logger: LoggerService;
  private static instance: KubernetesService;

  private readonly GATEWAY_API_GROUP = 'gateway.networking.k8s.io';
  private readonly GATEWAY_API_VERSION = 'v1beta1';
  private readonly ENVOY_GATEWAY_GROUP = 'gateway.envoyproxy.io';
  private readonly ENVOY_GATEWAY_VERSION = 'v1alpha1';

  private constructor() {
    super();
    this.logger = LoggerService.getInstance();
    this.initializeKubernetesClient();
  }

  public static getInstance(): KubernetesService {
    if (!KubernetesService.instance) {
      KubernetesService.instance = new KubernetesService();
    }
    return KubernetesService.instance;
  }

  private initializeKubernetesClient(): void {
    try {
      const kc = new k8s.KubeConfig();
      
      // For Docker Desktop, use the default context
      if (process.env.NODE_ENV === 'production' || process.env.DOCKER_CONTEXT) {
        kc.loadFromDefault();
      } else {
        // For development, you might want to load from a specific config file
        kc.loadFromDefault();
      }

      this.k8sApi = kc.makeApiClient(k8s.KubernetesApi);
      this.coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
      this.customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);
      this.appsV1Api = kc.makeApiClient(k8s.AppsV1Api);

      this.logger.info('✅ Kubernetes client initialized');
      this.validateConnection();
    } catch (error) {
      this.logger.error('❌ Failed to initialize Kubernetes client:', error);
      throw new KubernetesError('Failed to initialize Kubernetes client');
    }
  }

  private async validateConnection(): Promise<void> {
    try {
      await this.coreV1Api.listNamespaces();
      this.logger.info('✅ Kubernetes connection validated');
    } catch (error) {
      this.logger.error('❌ Kubernetes connection validation failed:', error);
      throw new KubernetesError('Failed to connect to Kubernetes cluster');
    }
  }

  /**
   * Lists all namespaces
   */
  public async listNamespaces(): Promise<string[]> {
    try {
      const response = await this.coreV1Api.listNamespaces();
      return response.body.items.map(ns => ns.metadata?.name || '').filter(name => name);
    } catch (error) {
      this.logger.error('Error listing namespaces:', error);
      throw new KubernetesError(`Failed to list namespaces: ${error.message}`);
    }
  }

  /**
   * Creates a namespace if it doesn't exist
   */
  public async ensureNamespace(name: string): Promise<void> {
    try {
      await this.coreV1Api.readNamespace(name);
      this.logger.info(`Namespace ${name} already exists`);
    } catch (error) {
      if (error.statusCode === 404) {
        try {
          await this.coreV1Api.createNamespace({
            metadata: { name },
          });
          this.logger.info(`Namespace ${name} created`);
        } catch (createError) {
          this.logger.error(`Error creating namespace ${name}:`, createError);
          throw new KubernetesError(`Failed to create namespace: ${createError.message}`);
        }
      } else {
        this.logger.error(`Error checking namespace ${name}:`, error);
        throw new KubernetesError(`Failed to check namespace: ${error.message}`);
      }
    }
  }

  /**
   * Lists all gateways
   */
  public async listGateways(namespace?: string): Promise<Gateway[]> {
    try {
      const response = namespace
        ? await this.customObjectsApi.listNamespacedCustomObject(
            this.GATEWAY_API_GROUP,
            this.GATEWAY_API_VERSION,
            namespace,
            'gateways'
          )
        : await this.customObjectsApi.listClusterCustomObject(
            this.GATEWAY_API_GROUP,
            this.GATEWAY_API_VERSION,
            'gateways'
          );

      return (response.body as any).items.map((item: any) => this.mapGatewayFromK8s(item));
    } catch (error) {
      this.logger.error('Error listing gateways:', error);
      throw new KubernetesError(`Failed to list gateways: ${error.message}`);
    }
  }

  /**
   * Gets a specific gateway
   */
  public async getGateway(name: string, namespace: string): Promise<Gateway | null> {
    try {
      const response = await this.customObjectsApi.getNamespacedCustomObject(
        this.GATEWAY_API_GROUP,
        this.GATEWAY_API_VERSION,
        namespace,
        'gateways',
        name
      );

      return this.mapGatewayFromK8s(response.body);
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      this.logger.error(`Error getting gateway ${name}:`, error);
      throw new KubernetesError(`Failed to get gateway: ${error.message}`);
    }
  }

  /**
   * Creates a new gateway
   */
  public async createGateway(gateway: Gateway): Promise<Gateway> {
    try {
      const k8sGateway = this.mapGatewayToK8s(gateway);
      
      const response = await this.customObjectsApi.createNamespacedCustomObject(
        this.GATEWAY_API_GROUP,
        this.GATEWAY_API_VERSION,
        gateway.namespace,
        'gateways',
        k8sGateway
      );

      const createdGateway = this.mapGatewayFromK8s(response.body);
      this.emit('gatewayCreated', createdGateway);
      return createdGateway;
    } catch (error) {
      this.logger.error('Error creating gateway:', error);
      throw new KubernetesError(`Failed to create gateway: ${error.message}`);
    }
  }

  /**
   * Updates an existing gateway
   */
  public async updateGateway(gateway: Gateway): Promise<Gateway> {
    try {
      const k8sGateway = this.mapGatewayToK8s(gateway);
      
      const response = await this.customObjectsApi.replaceNamespacedCustomObject(
        this.GATEWAY_API_GROUP,
        this.GATEWAY_API_VERSION,
        gateway.namespace,
        'gateways',
        gateway.name,
        k8sGateway
      );

      const updatedGateway = this.mapGatewayFromK8s(response.body);
      this.emit('gatewayUpdated', updatedGateway);
      return updatedGateway;
    } catch (error) {
      this.logger.error('Error updating gateway:', error);
      throw new KubernetesError(`Failed to update gateway: ${error.message}`);
    }
  }

  /**
   * Deletes a gateway
   */
  public async deleteGateway(name: string, namespace: string): Promise<void> {
    try {
      await this.customObjectsApi.deleteNamespacedCustomObject(
        this.GATEWAY_API_GROUP,
        this.GATEWAY_API_VERSION,
        namespace,
        'gateways',
        name
      );

      this.logger.info(`Gateway ${name} deleted from namespace ${namespace}`);
      this.emit('gatewayDeleted', { name, namespace });
    } catch (error) {
      this.logger.error(`Error deleting gateway ${name}:`, error);
      throw new KubernetesError(`Failed to delete gateway: ${error.message}`);
    }
  }

  /**
   * Lists all HTTP routes
   */
  public async listHTTPRoutes(namespace?: string): Promise<HTTPRoute[]> {
    try {
      const response = namespace
        ? await this.customObjectsApi.listNamespacedCustomObject(
            this.GATEWAY_API_GROUP,
            this.GATEWAY_API_VERSION,
            namespace,
            'httproutes'
          )
        : await this.customObjectsApi.listClusterCustomObject(
            this.GATEWAY_API_GROUP,
            this.GATEWAY_API_VERSION,
            'httproutes'
          );

      return (response.body as any).items.map((item: any) => this.mapHTTPRouteFromK8s(item));
    } catch (error) {
      this.logger.error('Error listing HTTP routes:', error);
      throw new KubernetesError(`Failed to list HTTP routes: ${error.message}`);
    }
  }

  /**
   * Gets a specific HTTP route
   */
  public async getHTTPRoute(name: string, namespace: string): Promise<HTTPRoute | null> {
    try {
      const response = await this.customObjectsApi.getNamespacedCustomObject(
        this.GATEWAY_API_GROUP,
        this.GATEWAY_API_VERSION,
        namespace,
        'httproutes',
        name
      );

      return this.mapHTTPRouteFromK8s(response.body);
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      this.logger.error(`Error getting HTTP route ${name}:`, error);
      throw new KubernetesError(`Failed to get HTTP route: ${error.message}`);
    }
  }

  /**
   * Creates a new HTTP route
   */
  public async createHTTPRoute(route: HTTPRoute): Promise<HTTPRoute> {
    try {
      const k8sRoute = this.mapHTTPRouteToK8s(route);
      
      const response = await this.customObjectsApi.createNamespacedCustomObject(
        this.GATEWAY_API_GROUP,
        this.GATEWAY_API_VERSION,
        route.namespace,
        'httproutes',
        k8sRoute
      );

      const createdRoute = this.mapHTTPRouteFromK8s(response.body);
      this.emit('routeCreated', createdRoute);
      return createdRoute;
    } catch (error) {
      this.logger.error('Error creating HTTP route:', error);
      throw new KubernetesError(`Failed to create HTTP route: ${error.message}`);
    }
  }

  /**
   * Updates an existing HTTP route
   */
  public async updateHTTPRoute(route: HTTPRoute): Promise<HTTPRoute> {
    try {
      const k8sRoute = this.mapHTTPRouteToK8s(route);
      
      const response = await this.customObjectsApi.replaceNamespacedCustomObject(
        this.GATEWAY_API_GROUP,
        this.GATEWAY_API_VERSION,
        route.namespace,
        'httproutes',
        route.name,
        k8sRoute
      );

      const updatedRoute = this.mapHTTPRouteFromK8s(response.body);
      this.emit('routeUpdated', updatedRoute);
      return updatedRoute;
    } catch (error) {
      this.logger.error('Error updating HTTP route:', error);
      throw new KubernetesError(`Failed to update HTTP route: ${error.message}`);
    }
  }

  /**
   * Deletes an HTTP route
   */
  public async deleteHTTPRoute(name: string, namespace: string): Promise<void> {
    try {
      await this.customObjectsApi.deleteNamespacedCustomObject(
        this.GATEWAY_API_GROUP,
        this.GATEWAY_API_VERSION,
        namespace,
        'httproutes',
        name
      );

      this.logger.info(`HTTP route ${name} deleted from namespace ${namespace}`);
      this.emit('routeDeleted', { name, namespace });
    } catch (error) {
      this.logger.error(`Error deleting HTTP route ${name}:`, error);
      throw new KubernetesError(`Failed to delete HTTP route: ${error.message}`);
    }
  }

  /**
   * Applies a YAML configuration
   */
  public async applyYamlConfiguration(yamlContent: string): Promise<any[]> {
    try {
      const docs = yaml.loadAll(yamlContent);
      const results = [];

      for (const doc of docs) {
        if (!doc || typeof doc !== 'object') continue;

        const resource = doc as KubernetesResource;
        const result = await this.applyResource(resource);
        results.push(result);
      }

      return results;
    } catch (error) {
      this.logger.error('Error applying YAML configuration:', error);
      throw new KubernetesError(`Failed to apply YAML configuration: ${error.message}`);
    }
  }

  /**
   * Applies a single Kubernetes resource
   */
  private async applyResource(resource: KubernetesResource): Promise<any> {
    const { apiVersion, kind, metadata } = resource;
    const namespace = metadata.namespace || 'default';

    try {
      // Check if resource exists
      let existing = null;
      
      if (kind === 'Gateway' && apiVersion.includes('gateway.networking.k8s.io')) {
        existing = await this.getGateway(metadata.name, namespace);
      } else if (kind === 'HTTPRoute' && apiVersion.includes('gateway.networking.k8s.io')) {
        existing = await this.getHTTPRoute(metadata.name, namespace);
      }

      if (existing) {
        // Update existing resource
        return this.updateResource(resource);
      } else {
        // Create new resource
        return this.createResource(resource);
      }
    } catch (error) {
      this.logger.error(`Error applying resource ${kind}/${metadata.name}:`, error);
      throw new KubernetesError(`Failed to apply resource: ${error.message}`);
    }
  }

  private async createResource(resource: KubernetesResource): Promise<any> {
    const { apiVersion, kind, metadata } = resource;
    const namespace = metadata.namespace || 'default';

    if (kind === 'Gateway' && apiVersion.includes('gateway.networking.k8s.io')) {
      const [group, version] = apiVersion.split('/');
      return this.customObjectsApi.createNamespacedCustomObject(
        group,
        version,
        namespace,
        'gateways',
        resource
      );
    } else if (kind === 'HTTPRoute' && apiVersion.includes('gateway.networking.k8s.io')) {
      const [group, version] = apiVersion.split('/');
      return this.customObjectsApi.createNamespacedCustomObject(
        group,
        version,
        namespace,
        'httproutes',
        resource
      );
    }

    throw new KubernetesError(`Unsupported resource type: ${kind}`);
  }

  private async updateResource(resource: KubernetesResource): Promise<any> {
    const { apiVersion, kind, metadata } = resource;
    const namespace = metadata.namespace || 'default';

    if (kind === 'Gateway' && apiVersion.includes('gateway.networking.k8s.io')) {
      const [group, version] = apiVersion.split('/');
      return this.customObjectsApi.replaceNamespacedCustomObject(
        group,
        version,
        namespace,
        'gateways',
        metadata.name,
        resource
      );
    } else if (kind === 'HTTPRoute' && apiVersion.includes('gateway.networking.k8s.io')) {
      const [group, version] = apiVersion.split('/');
      return this.customObjectsApi.replaceNamespacedCustomObject(
        group,
        version,
        namespace,
        'httproutes',
        metadata.name,
        resource
      );
    }

    throw new KubernetesError(`Unsupported resource type: ${kind}`);
  }

  /**
   * Gets cluster information
   */
  public async getClusterInfo(): Promise<any> {
    try {
      const version = await this.k8sApi.getCodeVersion();
      const nodes = await this.coreV1Api.listNodes();
      
      return {
        version: version.body,
        nodeCount: nodes.body.items.length,
        nodes: nodes.body.items.map(node => ({
          name: node.metadata?.name,
          status: this.getNodeStatus(node),
          version: node.status?.nodeInfo?.kubeletVersion,
        })),
      };
    } catch (error) {
      this.logger.error('Error getting cluster info:', error);
      throw new KubernetesError(`Failed to get cluster info: ${error.message}`);
    }
  }

  private getNodeStatus(node: any): string {
    const conditions = node.status?.conditions || [];
    const readyCondition = conditions.find((c: any) => c.type === 'Ready');
    return readyCondition?.status === 'True' ? 'Ready' : 'NotReady';
  }

  /**
   * Checks if Envoy Gateway is installed
   */
  public async isEnvoyGatewayInstalled(): Promise<boolean> {
    try {
      // Check for Envoy Gateway deployment
      const response = await this.appsV1Api.listNamespacedDeployment('envoy-gateway-system');
      const envoyGatewayDeployment = response.body.items.find(
        dep => dep.metadata?.name === 'envoy-gateway'
      );
      
      return !!envoyGatewayDeployment;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      this.logger.error('Error checking Envoy Gateway installation:', error);
      return false;
    }
  }

  /**
   * Maps Kubernetes Gateway object to our Gateway type
   */
  private mapGatewayFromK8s(k8sGateway: any): Gateway {
    const metadata = k8sGateway.metadata || {};
    const spec = k8sGateway.spec || {};
    const status = k8sGateway.status || {};

    return {
      id: metadata.uid || '',
      name: metadata.name || '',
      namespace: metadata.namespace || '',
      status: this.mapGatewayStatus(status),
      listeners: (status.listeners || []).map((listener: any) => ({
        name: listener.name,
        hostname: listener.hostname,
        port: listener.port,
        protocol: listener.protocol,
        attachedRoutes: listener.attachedRoutes || 0,
        conditions: (listener.conditions || []).map((cond: any) => ({
          type: cond.type,
          status: cond.status,
          reason: cond.reason,
          message: cond.message,
          lastTransitionTime: new Date(cond.lastTransitionTime),
        })),
      })),
      createdAt: new Date(metadata.creationTimestamp),
      updatedAt: new Date(metadata.creationTimestamp),
      spec: {
        gatewayClassName: spec.gatewayClassName || '',
        listeners: spec.listeners || [],
        addresses: spec.addresses || [],
      },
      conditions: (status.conditions || []).map((cond: any) => ({
        type: cond.type,
        status: cond.status,
        reason: cond.reason,
        message: cond.message,
        lastTransitionTime: new Date(cond.lastTransitionTime),
      })),
    };
  }

  /**
   * Maps our Gateway type to Kubernetes Gateway object
   */
  private mapGatewayToK8s(gateway: Gateway): any {
    return {
      apiVersion: `${this.GATEWAY_API_GROUP}/${this.GATEWAY_API_VERSION}`,
      kind: 'Gateway',
      metadata: {
        name: gateway.name,
        namespace: gateway.namespace,
      },
      spec: gateway.spec,
    };
  }

  /**
   * Maps Kubernetes HTTPRoute object to our HTTPRoute type
   */
  private mapHTTPRouteFromK8s(k8sRoute: any): HTTPRoute {
    const metadata = k8sRoute.metadata || {};
    const spec = k8sRoute.spec || {};
    const status = k8sRoute.status || {};

    return {
      id: metadata.uid || '',
      name: metadata.name || '',
      namespace: metadata.namespace || '',
      status: this.mapRouteStatus(status),
      parentRefs: spec.parentRefs || [],
      hostnames: spec.hostnames || [],
      rules: spec.rules || [],
      createdAt: new Date(metadata.creationTimestamp),
      updatedAt: new Date(metadata.creationTimestamp),
      conditions: (status.conditions || []).map((cond: any) => ({
        type: cond.type,
        status: cond.status,
        reason: cond.reason,
        message: cond.message,
        lastTransitionTime: new Date(cond.lastTransitionTime),
      })),
    };
  }

  /**
   * Maps our HTTPRoute type to Kubernetes HTTPRoute object
   */
  private mapHTTPRouteToK8s(route: HTTPRoute): any {
    return {
      apiVersion: `${this.GATEWAY_API_GROUP}/${this.GATEWAY_API_VERSION}`,
      kind: 'HTTPRoute',
      metadata: {
        name: route.name,
        namespace: route.namespace,
      },
      spec: {
        parentRefs: route.parentRefs,
        hostnames: route.hostnames,
        rules: route.rules,
      },
    };
  }

  private mapGatewayStatus(status: any): GatewayStatus {
    if (!status || !status.conditions) {
      return GatewayStatus.UNKNOWN;
    }

    const acceptedCondition = status.conditions.find((c: any) => c.type === 'Accepted');
    const programmedCondition = status.conditions.find((c: any) => c.type === 'Programmed');

    if (acceptedCondition?.status === 'True' && programmedCondition?.status === 'True') {
      return GatewayStatus.READY;
    } else if (acceptedCondition?.status === 'False') {
      return GatewayStatus.FAILED;
    } else {
      return GatewayStatus.PENDING;
    }
  }

  private mapRouteStatus(status: any): RouteStatus {
    if (!status || !status.conditions) {
      return RouteStatus.UNKNOWN;
    }

    const acceptedCondition = status.conditions.find((c: any) => c.type === 'Accepted');
    const resolvedRefsCondition = status.conditions.find((c: any) => c.type === 'ResolvedRefs');

    if (acceptedCondition?.status === 'True' && resolvedRefsCondition?.status === 'True') {
      return RouteStatus.ACCEPTED;
    } else if (acceptedCondition?.status === 'False') {
      return RouteStatus.FAILED;
    } else {
      return RouteStatus.PENDING;
    }
  }

  /**
   * Health check for Kubernetes service
   */
  public async healthCheck(): Promise<{ status: string; version?: string; details?: any }> {
    try {
      const version = await this.k8sApi.getCodeVersion();
      const namespaces = await this.coreV1Api.listNamespaces();
      
      return {
        status: 'healthy',
        version: version.body.gitVersion,
        details: {
          platform: version.body.platform,
          namespaceCount: namespaces.body.items.length,
          envoyGatewayInstalled: await this.isEnvoyGatewayInstalled(),
        },
      };
    } catch (error) {
      this.logger.error('Kubernetes health check failed:', error);
      return {
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  }
}

export default KubernetesService;
