import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import * as k8s from '@kubernetes/client-node';
import Joi from 'joi';
import axios from 'axios';
import { isEqual, cloneDeep } from 'lodash';

// Import our enhanced error handling
import {
  AppError,
  createSuccessResponse,
  createErrorResponse,
  requestIdMiddleware,
  errorHandler,
  asyncHandler,
  withRetry,
  handleKubernetesError
} from './errorHandler';

import {
  Namespace,
  Gateway,
  Route,
  KubernetesConfig,
  QuickSetupStatus,
  ErrorCodes,
  ApiResponse,
  RetryConfig
} from './types';

// Mock data for demo mode
const mockNamespaces: Namespace[] = [
  { name: 'default', status: 'Active', createdAt: new Date('2023-01-01') },
  { name: 'envoy-gateway-system', status: 'Active', createdAt: new Date('2023-01-02') },
  { name: 'kube-system', status: 'Active', createdAt: new Date('2023-01-03') },
  { name: 'kube-public', status: 'Active', createdAt: new Date('2023-01-04') }
];

const mockGateways: Gateway[] = [
  { 
    name: 'api-gateway', 
    namespace: 'default', 
    status: 'Ready',
    gatewayClassName: 'envoy-gateway',
    listeners: [{ name: 'http', port: 80, protocol: 'HTTP' }],
    createdAt: new Date('2023-01-05')
  },
  {
    name: 'admin-gateway',
    namespace: 'envoy-gateway-system',
    status: 'Ready',
    gatewayClassName: 'envoy-gateway',
    listeners: [{ name: 'https', port: 443, protocol: 'HTTPS' }],
    createdAt: new Date('2023-01-06')
  }
];

const mockRoutes: Route[] = [
  {
    name: 'api-route',
    namespace: 'default', 
    status: 'Accepted',
    hostnames: ['api.example.com'],
    rules: [{ path: '/api/*' }],
    createdAt: new Date('2023-01-07')
  },
  {
    name: 'admin-route',
    namespace: 'envoy-gateway-system',
    status: 'Accepted', 
    hostnames: ['admin.example.com'],
    rules: [{ path: '/admin/*' }],
    createdAt: new Date('2023-01-08')
  }
];

class EnvoyGatewayBackend {
  private app: express.Application;
  private server: http.Server;
  private kubernetesClient: k8s.KubeConfig | null = null;
  private k8sApi: k8s.CoreV1Api | null = null;
  private customApi: k8s.CustomObjectsApi | null = null;
  private kubernetesConfig: KubernetesConfig;
  private retryConfig: RetryConfig;

  constructor() {
    this.app = express();
    this.kubernetesConfig = {
      enabled: false,
      connected: false,
      contextName: ''
    };
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 1.5
    };
    this.initializeKubernetes();
    this.setupMiddleware();
    this.setupRoutes();
    this.server = http.createServer(this.app);
  }

  private async initializeKubernetes(): Promise<void> {
    console.log('INITIALIZE KUBERNETES - MARKER_V5'); // This marker should be from the version that was actually running
    try {
      console.log('Initializing Kubernetes client...');
      this.kubernetesClient = new k8s.KubeConfig();
      
      const kubeconfigEnvPath = process.env.KUBECONFIG;
      console.log(`KUBECONFIG environment variable: ${kubeconfigEnvPath || 'not set'}`);
      
      console.log('Attempting to load Kubernetes config using loadFromDefault()...');
      this.kubernetesClient.loadFromDefault(); 
      console.log('Kubernetes config loaded via loadFromDefault().');

      const currentContextName = this.kubernetesClient.getCurrentContext();
      console.log(`Current K8s context from KubeConfig object: ${currentContextName}`);

      const currentCluster = this.kubernetesClient.getCurrentCluster();
      let finalServerUrl: string | undefined;

      if (currentCluster) {
        let serverUrl = currentCluster.server;
        console.log(`Original K8s cluster server URL from KubeConfig object: ${serverUrl}`);
        
        const localhostPattern = /\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?/;
        if (localhostPattern.test(serverUrl)) {
          finalServerUrl = serverUrl.replace(localhostPattern, `//host.docker.internal$2`);
          console.log(`Modified K8s cluster server URL for container: ${finalServerUrl}`);
        } else {
          finalServerUrl = serverUrl;
        }
      } else {
        console.log('Could not get current cluster from KubeConfig object (after loadFromDefault).');
        throw new Error('Failed to get current Kubernetes cluster from KubeConfig.');
      }

      if (!finalServerUrl) {
        throw new Error('Kubernetes server URL could not be determined.');
      }

      // If using host.docker.internal, find the cluster in KubeConfig and replace it
      // with a new configuration that has skipTLSVerify: true and the updated server URL.
      if (this.kubernetesClient && finalServerUrl.includes('//host.docker.internal')) {
        const clusterIndex = this.kubernetesClient.clusters.findIndex(c => c.name === currentContextName);
        if (clusterIndex !== -1) {
          const originalCluster = this.kubernetesClient.clusters[clusterIndex];
          console.log(`MARKER_V7: Modifying cluster config for '${originalCluster.name}' to use server '${finalServerUrl}' and skipTLSVerify=true.`);
          this.kubernetesClient.clusters[clusterIndex] = {
            name: originalCluster.name,
            server: finalServerUrl, 
            skipTLSVerify: true,    
            caData: originalCluster.caData, 
          };
        } else {
          console.warn(`MARKER_V7: Could not find cluster '${currentContextName}' in KubeConfig clusters list to update for skipTLSVerify.`);
        }
      }

      this.k8sApi = new k8s.CoreV1Api(finalServerUrl);
      this.k8sApi.setDefaultAuthentication(this.kubernetesClient!); 

      this.customApi = new k8s.CustomObjectsApi(finalServerUrl);
      this.customApi.setDefaultAuthentication(this.kubernetesClient!);
      
      console.log('Attempting Kubernetes connection test...');
      await this.testKubernetesConnection();

      this.kubernetesConfig = {
        enabled: true,
        connected: true,
        contextName: this.kubernetesClient.getCurrentContext(),
      };
      console.log(`Successfully connected to Kubernetes context: ${this.kubernetesConfig.contextName}`);

    } catch (error: any) {
      console.error('Failed to initialize Kubernetes client (outer catch):', error);
      this.kubernetesConfig = {
        enabled: true, 
        connected: false,
        contextName: 'N/A (Error)',
        error: error.message || 'Unknown Kubernetes initialization error',
      };
      this.k8sApi = null; 
      this.customApi = null;
    }
  }

  private async testKubernetesConnection(): Promise<void> {
    if (!this.k8sApi) throw new Error('Kubernetes API not initialized');
    
    try {
      await this.k8sApi.listNamespace();
      console.log('Kubernetes connection test successful');
    } catch (error) {
      console.error('Kubernetes connection test failed:', error);
      throw handleKubernetesError(error);
    }
  }

  // ... (rest of the file is identical to the final_file_content from 5:08 PM) ...
  // (Make sure to include the ENTIRE rest of the file here, unchanged)
  private setupMiddleware(): void {
    // Add request ID middleware first
    this.app.use(requestIdMiddleware);
    
    this.app.use(cors());
    this.app.use(express.json());

    // Log all requests with request ID
    this.app.use((req, res, next) => {
      console.log(`[${req.requestId}] ${new Date().toISOString()} ${req.method} ${req.path}`, req.query);
      next();
    });
  }

  private setupRoutes(): void {
    // Serve static files from the UI directory
    this.app.use(express.static('/ui-new'));
    
    // Serve index.html for the root path
    this.app.get('/', (req, res) => {
      res.sendFile('/ui-new/index.html');
    });

    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      console.log(`[${req.requestId}] Health check requested from ${req.ip || 'unknown IP'}`);
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        mode: process.env.DD_EXTENSION === 'true' ? 'docker-desktop-extension' : 'development',
        kubernetes: this.kubernetesConfig.connected,
        connection: process.env.DD_EXTENSION === 'true' ? 'socket' : 'http',
        context: this.kubernetesConfig.contextName || 'none',
        socketPath: process.env.SOCKET_PATH || 'not set',
        environment: process.env.NODE_ENV || 'development',
        error: this.kubernetesConfig.error
      };
      res.json(createSuccessResponse(healthData, 'Backend is healthy', req.requestId));
    });

    // Namespaces API
    this.app.get('/api/namespaces', asyncHandler(async (req, res) => {
      console.log(`[${req.requestId}] Namespaces requested`);
      
      if (this.kubernetesConfig.connected && this.k8sApi) {
        try {
          const namespaces = await withRetry(
            async () => {
              const response = await this.k8sApi!.listNamespace();
              return response.body.items.map(ns => ({
                name: ns.metadata?.name || 'unknown',
                status: ns.status?.phase || 'Unknown',
                createdAt: ns.metadata?.creationTimestamp || new Date()
              }));
            },
            this.retryConfig,
            req.requestId
          );
          
          res.json(createSuccessResponse(
            { namespaces },
            `Found ${namespaces.length} namespaces`,
            req.requestId
          ));
        } catch (error) {
          throw handleKubernetesError(error, req.requestId);
        }
      } else {
        // Fallback to mock data
        res.json(createSuccessResponse(
          { namespaces: mockNamespaces },
          'Demo mode: using mock namespaces',
          req.requestId
        ));
      }
    }));

    // Gateways API
    this.app.get('/api/gateways', asyncHandler(async (req, res) => {
      console.log(`[${req.requestId}] Gateways requested, namespace:`, req.query.namespace);
      const namespace = req.query.namespace as string;
      
      if (this.kubernetesConfig.connected && this.customApi) {
        try {
          const gateways = await withRetry(
            () => this.fetchGatewaysFromK8s(namespace, req.requestId),
            this.retryConfig,
            req.requestId
          );
          
          res.json(createSuccessResponse(
            { gateways, total: gateways.length },
            `Found ${gateways.length} gateways`,
            req.requestId
          ));
        } catch (error) {
          throw handleKubernetesError(error, req.requestId);
        }
      } else {
        // Fallback to mock data
        let filteredGateways = mockGateways;
        if (namespace && namespace !== '' && namespace !== 'All Namespaces') {
          filteredGateways = mockGateways.filter(g => g.namespace === namespace);
        }
        
        res.json(createSuccessResponse(
          { gateways: filteredGateways, total: filteredGateways.length },
          'Demo mode: using mock gateways',
          req.requestId
        ));
      }
    }));

    // Routes API (HTTPRoutes)
    this.app.get('/api/routes', asyncHandler(async (req, res) => {
      console.log(`[${req.requestId}] Routes requested, namespace:`, req.query.namespace);
      const namespace = req.query.namespace as string;
      
      if (this.kubernetesConfig.connected && this.customApi) {
        try {
          const routes = await withRetry(
            () => this.fetchRoutesFromK8s(namespace, req.requestId),
            this.retryConfig,
            req.requestId
          );
          
          res.json(createSuccessResponse(
            { routes, total: routes.length },
            `Found ${routes.length} routes`,
            req.requestId
          ));
        } catch (error) {
          throw handleKubernetesError(error, req.requestId);
        }
      } else {
        // Fallback to mock data
        let filteredRoutes = mockRoutes;
        if (namespace && namespace !== '' && namespace !== 'All Namespaces') {
          filteredRoutes = mockRoutes.filter(r => r.namespace === namespace);
        }
        
        res.json(createSuccessResponse(
          { routes: filteredRoutes, total: filteredRoutes.length },
          'Demo mode: using mock routes',
          req.requestId
        ));
      }
    }));

    // Gateway creation endpoint
    this.app.post('/api/gateways', this.validateGateway, asyncHandler(async (req, res) => {
      console.log(`[${req.requestId}] Gateway creation requested:`, req.body);
      
      if (!this.kubernetesConfig.connected || !this.customApi) {
        throw new AppError(
          ErrorCodes.KUBERNETES_NOT_AVAILABLE,
          'Kubernetes not connected - demo mode only',
          { requestedGateway: req.body },
          req.requestId
        );
      }

      const gatewayResource = this.buildGatewayResource(req.body);
      
      try {
        const response = await withRetry(
          async () => {
            return await this.customApi!.createNamespacedCustomObject(
              'gateway.networking.k8s.io',
              'v1',
              req.body.namespace,
              'gateways',
              gatewayResource
            );
          },
          this.retryConfig,
          req.requestId
        );
        
        res.json(createSuccessResponse(
          { gateway: response.body },
          `Gateway '${req.body.name}' created successfully`,
          req.requestId
        ));
      } catch (error) {
        throw new AppError(
          ErrorCodes.GATEWAY_CREATION_FAILED,
          `Failed to create gateway '${req.body.name}'`,
          { gatewayResource, originalError: error },
          req.requestId
        );
      }
    }));

    // Route creation endpoint
    this.app.post('/api/routes', this.validateRoute, asyncHandler(async (req, res) => {
      console.log(`[${req.requestId}] Route creation requested:`, req.body);
      
      if (!this.kubernetesConfig.connected || !this.customApi) {
        throw new AppError(
          ErrorCodes.KUBERNETES_NOT_AVAILABLE,
          'Kubernetes not connected - demo mode only',
          { requestedRoute: req.body },
          req.requestId
        );
      }

      const routeResource = this.buildRouteResource(req.body);
      
      try {
        const response = await withRetry(
          async () => {
            return await this.customApi!.createNamespacedCustomObject(
              'gateway.networking.k8s.io',
              'v1',
              req.body.namespace,
              'httproutes',
              routeResource
            );
          },
          this.retryConfig,
          req.requestId
        );
        
        res.json(createSuccessResponse(
          { route: response.body },
          `Route '${req.body.name}' created successfully`,
          req.requestId
        ));
      } catch (error) {
        throw new AppError(
          ErrorCodes.ROUTE_CREATION_FAILED,
          `Failed to create route '${req.body.name}'`,
          { routeResource, originalError: error },
          req.requestId
        );
      }
    }));

    // Quick setup endpoints
    this.app.get('/api/quick-setup/status', asyncHandler(async (req, res) => {
      console.log(`[${req.requestId}] Quick setup status requested`);
      
      try {
        const status = await withRetry(
          () => this.getQuickSetupStatus(req.requestId),
          this.retryConfig,
          req.requestId
        );
        
        res.json(createSuccessResponse(
          {
            ready: this.isQuickSetupReady(status),
            checks: status,
            message: this.getQuickSetupMessage(status)
          },
          'Quick setup status checked',
          req.requestId
        ));
      } catch (error) {
        throw handleKubernetesError(error, req.requestId);
      }
    }));

    this.app.post('/api/quick-setup/install', asyncHandler(async (req, res) => {
      console.log(`[${req.requestId}] Quick setup install requested`);
      
      if (!this.kubernetesConfig.connected) {
        throw new AppError(
          ErrorCodes.KUBERNETES_NOT_AVAILABLE,
          'Kubernetes is not connected. Please ensure Docker Desktop Kubernetes is enabled.',
          {},
          req.requestId
        );
      }

      try {
        const installationResult = await withRetry(
          () => this.performQuickSetup(req.requestId),
          { ...this.retryConfig, maxRetries: 1 }, // Only one retry for installation
          req.requestId
        );
        
        res.json(createSuccessResponse(
          installationResult,
          'Quick setup completed',
          req.requestId
        ));
      } catch (error) {
        throw new AppError(
          ErrorCodes.UNKNOWN_ERROR,
          'Quick setup failed',
          { originalError: error },
          req.requestId
        );
      }
    }));

    // Use the enhanced error handler
    this.app.use(errorHandler);

    // 404 handler
    this.app.use((req, res) => {
      console.log(`[${req.requestId}] 404 - Not found:`, req.path);
      res.status(404).json(createErrorResponse(
        'NOT_FOUND',
        `Endpoint ${req.method} ${req.path} not found`,
        { path: req.path, method: req.method },
        req.requestId
      ));
    });
  }

  // Kubernetes helper methods
  private async fetchGatewaysFromK8s(namespace?: string, requestId?: string): Promise<Gateway[]> {
    if (!this.customApi) throw new Error('Kubernetes custom API not initialized');
    
    try {
      const response = namespace
        ? await this.customApi.listNamespacedCustomObject(
            'gateway.networking.k8s.io',
            'v1',
            namespace,
            'gateways'
          )
        : await this.customApi.listClusterCustomObject(
            'gateway.networking.k8s.io',
            'v1',
            'gateways'
          );
      
      const gateways: Gateway[] = (response.body as any).items.map((item: any) => ({
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        status: item.status?.conditions?.[0]?.type || 'Unknown',
        gatewayClassName: item.spec.gatewayClassName,
        listeners: item.spec.listeners || [],
        createdAt: item.metadata.creationTimestamp || new Date()
      }));
      
      return gateways;
    } catch (error) {
      console.error(`[${requestId}] Error fetching gateways from Kubernetes:`, error);
      throw error;
    }
  }

  private async fetchRoutesFromK8s(namespace?: string, requestId?: string): Promise<Route[]> {
    if (!this.customApi) throw new Error('Kubernetes custom API not initialized');
    
    try {
      const response = namespace
        ? await this.customApi.listNamespacedCustomObject(
            'gateway.networking.k8s.io',
            'v1',
            namespace,
            'httproutes'
          )
        : await this.customApi.listClusterCustomObject(
            'gateway.networking.k8s.io',
            'v1',
            'httproutes'
          );
      
      const routes: Route[] = (response.body as any).items.map((item: any) => ({
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        status: item.status?.parents?.[0]?.conditions?.[0]?.type || 'Unknown',
        hostnames: item.spec.hostnames || [],
        rules: item.spec.rules || [],
        createdAt: item.metadata.creationTimestamp || new Date()
      }));
      
      return routes;
    } catch (error) {
      console.error(`[${requestId}] Error fetching routes from Kubernetes:`, error);
      throw error;
    }
  }

  // Validation middleware
  private validateGateway = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const schema = Joi.object({
      name: Joi.string().required(),
      namespace: Joi.string().required(),
      gatewayClassName: Joi.string().required(),
      listeners: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          port: Joi.number().required(),
          protocol: Joi.string().required()
        })
      ).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Gateway validation failed',
        { validationErrors: error.details },
        req.requestId
      );
    }
    next();
  };

  private validateRoute = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const schema = Joi.object({
      name: Joi.string().required(),
      namespace: Joi.string().required(),
      hostnames: Joi.array().items(Joi.string()),
      rules: Joi.array().items(
        Joi.object({
          path: Joi.string().required()
        })
      ).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Route validation failed',
        { validationErrors: error.details },
        req.requestId
      );
    }
    next();
  };

  // Resource builders
  private buildGatewayResource(data: any): any {
    return {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'Gateway',
      metadata: {
        name: data.name,
        namespace: data.namespace
      },
      spec: {
        gatewayClassName: data.gatewayClassName,
        listeners: data.listeners
      }
    };
  }

  private buildRouteResource(data: any): any {
    return {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'HTTPRoute',
      metadata: {
        name: data.name,
        namespace: data.namespace
      },
      spec: {
        hostnames: data.hostnames,
        rules: data.rules
      }
    };
  }

  // Quick setup methods
  private async getQuickSetupStatus(requestId?: string): Promise<QuickSetupStatus> {
    const status: QuickSetupStatus = {
      dockerDesktopRunning: true, // Assume true if we're running
      kubernetesEnabled: this.kubernetesConfig.connected,
      envoyGatewayInstalled: false,
      namespaceReady: false,
      gatewayClassCreated: false
    };

    if (!this.kubernetesConfig.connected || !this.k8sApi || !this.customApi) {
      return status;
    }

    try {
      // Check if Envoy Gateway namespace exists
      try {
        await this.k8sApi.readNamespace('envoy-gateway-system');
        status.namespaceReady = true;
      } catch (error) {
        console.log(`[${requestId}] Envoy Gateway namespace not found`);
      }

      // Check if Envoy Gateway is installed (deployment exists)
      try {
        const appsApi = this.kubernetesClient!.makeApiClient(k8s.AppsV1Api);
        await appsApi.readNamespacedDeployment('envoy-gateway', 'envoy-gateway-system');
        status.envoyGatewayInstalled = true;
      } catch (error) {
        console.log(`[${requestId}] Envoy Gateway deployment not found`);
      }

      // Check if GatewayClass exists
      try {
        await this.customApi.getClusterCustomObject(
          'gateway.networking.k8s.io',
          'v1',
          'gatewayclasses',
          'envoy-gateway'
        );
        status.gatewayClassCreated = true;
      } catch (error) {
        console.log(`[${requestId}] Envoy Gateway GatewayClass not found`);
      }
    } catch (error) {
      console.error(`[${requestId}] Error checking setup status:`, error);
      throw handleKubernetesError(error, requestId);
    }

    return status;
  }

  private isQuickSetupReady(status: QuickSetupStatus): boolean {
    return status.dockerDesktopRunning && 
           status.kubernetesEnabled && 
           status.envoyGatewayInstalled && 
           status.namespaceReady && 
           status.gatewayClassCreated;
  }

  private getQuickSetupMessage(status: QuickSetupStatus): string {
    if (!status.kubernetesEnabled) {
      return 'Please enable Kubernetes in Docker Desktop settings';
    }
    if (!status.envoyGatewayInstalled) {
      return 'Ready to install Envoy Gateway';
    }
    if (this.isQuickSetupReady(status)) {
      return 'Envoy Gateway is installed and ready to use';
    }
    return 'Checking installation status...';
  }

  private async performQuickSetup(requestId?: string): Promise<any> {
    console.log(`[${requestId}] Starting Envoy Gateway quick setup...`);
    
    try {
      // Install Envoy Gateway using kubectl apply (simulated)
      const installUrl = 'https://github.com/envoyproxy/gateway/releases/download/v1.2.0/install.yaml';
      
      // In a real implementation, you would download and apply the YAML
      // For now, we'll simulate the installation
      console.log(`[${requestId}] Simulating Envoy Gateway installation...`);
      
      // Wait for installation to complete (simulated)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        message: 'Envoy Gateway installed successfully (simulated)',
        steps: [
          'Downloaded Envoy Gateway manifests',
          'Applied to Kubernetes cluster',
          'Created envoy-gateway-system namespace',
          'Deployed Envoy Gateway controller',
          'Created EnvoyGateway GatewayClass'
        ]
      };
    } catch (error) {
      console.error(`[${requestId}] Quick setup failed:`, error);
      throw new AppError(
        ErrorCodes.UNKNOWN_ERROR,
        'Failed to install Envoy Gateway',
        { originalError: error },
        requestId
      );
    }
  }

  public start(): void {
    const isDockerDesktopExtension = process.env.DD_EXTENSION === 'true';
    // Use the Docker Desktop extension socket path
    const socketPath = process.env.SOCKET_PATH || '/run/guest-services/extension-envoy-gateway-extension.sock';
    const port = parseInt(process.env.PORT || '8080', 10);
    
    console.log('Starting server with config:');
    console.log(`- DD_EXTENSION: ${isDockerDesktopExtension}`);
    console.log(`- Socket path: ${socketPath}`);
    console.log(`- PORT: ${port}`);
    console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
    
    if (isDockerDesktopExtension) {
      // Use Unix socket for Docker Desktop extensions
      console.log(`Envoy Gateway Extension backend listening on socket: ${socketPath}`);
      
      // Make sure the socket doesn't already exist
      if (fs.existsSync(socketPath)) {
        console.log(`Socket file already exists at ${socketPath}, removing it...`);
        fs.unlinkSync(socketPath);
      }
      
      // Listen on the socket
      this.server.listen(socketPath, () => {
        console.log(`Envoy Gateway Extension backend started on socket: ${socketPath}`);
        console.log('Backend is healthy and ready to serve requests via socket');
        console.log(`Kubernetes connected: ${this.kubernetesConfig.connected}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } else {
      // Use HTTP port for development
      this.server.listen(port, '0.0.0.0', () => {
        console.log(`Envoy Gateway Extension backend listening on port ${port}`);
        console.log('Backend is healthy and ready to serve requests via HTTP');
        console.log(`Kubernetes connected: ${this.kubernetesConfig.connected}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    }

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully');
      this.server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully');
      this.server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  }
}

// Start the backend
const backend = new EnvoyGatewayBackend();
backend.start();
