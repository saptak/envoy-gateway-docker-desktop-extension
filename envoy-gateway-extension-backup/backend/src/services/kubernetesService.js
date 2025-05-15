const k8s = require('@kubernetes/client-node');
const yaml = require('js-yaml');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

class KubernetesService {
  constructor() {
    this.kc = new k8s.KubeConfig();
    this.k8sClient = null;
    this.customObjectsApi = null;
    this.connected = false;
    this.currentStrategy = 0;
    this.strategies = [];
    
    this.setupConnectionStrategies();
    this.initializeConnection();
  }

  setupConnectionStrategies() {
    this.strategies = [
      // Strategy 1: Skip TLS verification with host.docker.internal
      () => {
        console.log('Strategy 1: Skip TLS + host.docker.internal');
        try {
          this.kc.loadFromFile('/root/.kube/config');
          
          // Modify the server URL and skip TLS verification
          const clusters = this.kc.getClusters();
          clusters.forEach(cluster => {
            if (cluster.server && cluster.server.includes('127.0.0.1')) {
              const originalServer = cluster.server;
              cluster.server = cluster.server.replace('127.0.0.1', 'host.docker.internal');
              cluster.skipTLSVerify = true;
              console.log(`Modified cluster ${cluster.name}:`);
              console.log(`  FROM: ${originalServer}`);
              console.log(`  TO:   ${cluster.server} (TLS skipped)`);
            }
          });
          return true;
        } catch (error) {
          console.log('Strategy 1 failed:', error.message);
          return false;
        }
      },

      // Strategy 2: Force Docker Desktop port with TLS skip
      () => {
        console.log('Strategy 2: Force port 65168 + skip TLS');
        try {
          this.kc.loadFromFile('/root/.kube/config');
          
          const clusters = this.kc.getClusters();
          clusters.forEach(cluster => {
            // Force the docker-desktop cluster to use the correct port
            if (cluster.name === 'docker-desktop' || cluster.server.includes('127.0.0.1')) {
              cluster.server = 'https://host.docker.internal:65168';
              cluster.skipTLSVerify = true;
              console.log(`Forced cluster ${cluster.name} to: ${cluster.server}`);
            }
          });
          return true;
        } catch (error) {
          console.log('Strategy 2 failed:', error.message);
          return false;
        }
      },

      // Strategy 3: Create custom config with TLS skip
      () => {
        console.log('Strategy 3: Custom config + TLS skip');
        try {
          const kubeconfigObject = {
            apiVersion: 'v1',
            kind: 'Config',
            clusters: [{
              name: 'docker-desktop',
              cluster: {
                server: 'https://host.docker.internal:65168',
                insecureSkipTLSVerify: true
              }
            }],
            users: [{
              name: 'docker-desktop',
              user: {}
            }],
            contexts: [{
              name: 'docker-desktop',
              context: {
                cluster: 'docker-desktop',
                user: 'docker-desktop'
              }
            }],
            currentContext: 'docker-desktop'
          };
          
          this.kc.loadFromOptions(kubeconfigObject);
          console.log('Custom config loaded with TLS skip');
          return true;
        } catch (error) {
          console.log('Strategy 3 failed:', error.message);
          return false;
        }
      },

      // Strategy 4: Use the kubeconfig as-is but with localhost override
      () => {
        console.log('Strategy 4: Localhost with TLS skip');
        try {
          this.kc.loadFromFile('/root/.kube/config');
          
          // Try to use network mode to reach the host docker
          const clusters = this.kc.getClusters();
          clusters.forEach(cluster => {
            if (cluster.server) {
              // Keep original but add TLS skip
              cluster.skipTLSVerify = true;
              console.log(`Using original server with TLS skip: ${cluster.server}`);
            }
          });
          
          // Override with network host access
          process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
          return true;
        } catch (error) {
          console.log('Strategy 4 failed:', error.message);
          return false;
        }
      },

      // Strategy 5: In-cluster configuration (if available)
      () => {
        console.log('Strategy 5: In-cluster configuration');
        try {
          this.kc.loadFromCluster();
          console.log('In-cluster config loaded successfully');
          return true;
        } catch (error) {
          console.log('Strategy 5 failed (not in cluster):', error.message);
          return false;
        }
      }
    ];
  }

  async initializeConnection() {
    console.log('=== Starting Kubernetes Connection ===');
    this.debugKubeConfig();

    // Set global TLS to ignore errors for Docker Desktop
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

    let lastError = null;
    
    for (let i = 0; i < this.strategies.length; i++) {
      try {
        console.log(`🔄 Trying connection strategy ${i + 1}/${this.strategies.length}`);
        
        // Reset the kubeconfig before each strategy
        this.kc = new k8s.KubeConfig();
        
        // Try the strategy
        const success = this.strategies[i]();
        if (!success) continue;
        
        this.currentStrategy = i;
        
        // Log connection details for debugging
        const currentCluster = this.kc.getCurrentCluster();
        console.log(`📡 Attempting connection to: ${currentCluster?.server || 'unknown'}`);
        
        this.k8sClient = this.kc.makeApiClient(k8s.CoreV1Api);
        this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);

        // Test the connection
        console.log('Testing connection...');
        const startTime = Date.now();
        const nsResponse = await this.k8sClient.listNamespace();
        const endTime = Date.now();
        
        console.log(`✅ Connection successful in ${endTime - startTime}ms`);
        console.log(`Found ${nsResponse.body.items.length} namespaces`);
        console.log(`Using strategy ${i + 1}: ${this.getStrategyName(i)}`);
        
        this.connected = true;
        return;
        
      } catch (error) {
        lastError = error;
        console.log(`❌ Strategy ${i + 1} failed:`, error.message);
        continue;
      }
    }
    
    // All strategies failed - try one more time with network mode override
    console.log('🔄 Attempting final fallback with network mode');
    try {
      // Try using docker.for.mac.localhost as a last resort
      this.kc = new k8s.KubeConfig();
      this.kc.loadFromFile('/root/.kube/config');
      
      const clusters = this.kc.getClusters();
      clusters.forEach(cluster => {
        if (cluster.server && cluster.server.includes('127.0.0.1')) {
          cluster.server = cluster.server.replace('127.0.0.1', 'docker.for.mac.localhost');
          cluster.skipTLSVerify = true;
          console.log(`Final fallback - modified to: ${cluster.server}`);
        }
      });
      
      this.k8sClient = this.kc.makeApiClient(k8s.CoreV1Api);
      this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
      
      const nsResponse = await this.k8sClient.listNamespace();
      console.log(`✅ Fallback successful! Found ${nsResponse.body.items.length} namespaces`);
      this.connected = true;
      return;
      
    } catch (fallbackError) {
      console.log('❌ Final fallback also failed:', fallbackError.message);
    }
    
    // All strategies failed
    console.error('❌ All connection strategies failed. Last error:', lastError);
    this.connected = false;
  }

  getStrategyName(index) {
    const names = [
      'Skip TLS + host.docker.internal',
      'Force port 65168 + skip TLS',
      'Custom config + TLS skip',
      'Localhost with TLS skip',
      'In-cluster configuration'
    ];
    return names[index] || `Strategy ${index + 1}`;
  }

  debugKubeConfig() {
    console.log('\n=== Kubernetes Connection Debug Info ===');
    console.log('Environment Variables:');
    console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`  KUBECONFIG: ${process.env.KUBECONFIG || 'not set'}`);
    console.log(`  KUBERNETES_SERVICE_HOST: ${process.env.KUBERNETES_SERVICE_HOST || 'not set'}`);
    console.log(`  KUBERNETES_SERVICE_PORT: ${process.env.KUBERNETES_SERVICE_PORT || 'not set'}`);
    console.log(`  HOME: ${process.env.HOME || 'not set'}`);
    console.log(`  USER: ${process.env.USER || 'not set'}`);
    
    // Check file system
    console.log('\nFile System Checks:');
    const paths = [
      '/root/.kube/config',
      '/root/.kube/',
      '/.dockerenv'
    ];
    
    paths.forEach(checkPath => {
      const exists = fs.existsSync(checkPath);
      console.log(`  ${checkPath}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
      if (exists && checkPath.endsWith('config')) {
        try {
          const stats = fs.statSync(checkPath);
          console.log(`    Size: ${stats.size} bytes`);
          console.log(`    Modified: ${stats.mtime}`);
          
          // Check which clusters are available
          const content = fs.readFileSync(checkPath, 'utf8');
          const kubeconfig = yaml.load(content);
          if (kubeconfig.clusters) {
            console.log(`    Available clusters:`);
            kubeconfig.clusters.forEach(cluster => {
              console.log(`      - ${cluster.name}: ${cluster.cluster.server}`);
            });
          }
          if (kubeconfig['current-context']) {
            console.log(`    Current context: ${kubeconfig['current-context']}`);
          }
        } catch (e) {
          console.log(`    Error reading: ${e.message}`);
        }
      }
    });
    
    // Check network environment
    console.log('\nNetwork Environment:');
    console.log(`  Running in Docker: ${fs.existsSync('/.dockerenv')}`);
    console.log(`  TLS Verification: ${process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? 'DISABLED' : 'ENABLED'}`);
    
    console.log('==========================================\n');
  }

  isConnected() {
    return this.connected;
  }

  // Make the connection method public for retry attempts
  async reconnect() {
    console.log('\n=== RECONNECTION ATTEMPT ===');
    console.log('Resetting connection state...');
    this.connected = false;
    this.k8sClient = null;
    this.customObjectsApi = null;
    
    await this.initializeConnection();
    console.log(`Reconnection result: ${this.connected ? 'SUCCESS' : 'FAILED'}`);
    if (this.connected) {
      console.log(`Active strategy: ${this.getStrategyName(this.currentStrategy)}`);
    }
    console.log('===============================\n');
    return this.connected;
  }

  // Get detailed connection diagnostics
  async getConnectionDiagnostics() {
    const diagnostics = {
      connected: this.connected,
      currentStrategy: this.currentStrategy,
      strategyName: this.getStrategyName(this.currentStrategy),
      strategies: [],
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        KUBECONFIG: process.env.KUBECONFIG,
        KUBERNETES_SERVICE_HOST: process.env.KUBERNETES_SERVICE_HOST,
        KUBERNETES_SERVICE_PORT: process.env.KUBERNETES_SERVICE_PORT,
        TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
        runningInDocker: fs.existsSync('/.dockerenv'),
      },
      kubeconfig: {
        path: '/root/.kube/config',
        exists: fs.existsSync('/root/.kube/config'),
        readable: false,
        size: 0,
        clusters: [],
      },
      cluster: null,
    };

    // Check kubeconfig file
    if (diagnostics.kubeconfig.exists) {
      try {
        const stats = fs.statSync('/root/.kube/config');
        diagnostics.kubeconfig.readable = true;
        diagnostics.kubeconfig.size = stats.size;
        
        const content = fs.readFileSync('/root/.kube/config', 'utf8');
        const kubeconfig = yaml.load(content);
        if (kubeconfig.clusters) {
          diagnostics.kubeconfig.clusters = kubeconfig.clusters.map(cluster => ({
            name: cluster.name,
            server: cluster.cluster.server,
          }));
        }
      } catch (error) {
        console.log('Error reading kubeconfig:', error);
      }
    }

    // Get current cluster info if connected
    if (this.connected && this.kc) {
      const cluster = this.kc.getCurrentCluster();
      if (cluster) {
        diagnostics.cluster = {
          name: cluster.name,
          server: cluster.server,
          skipTLSVerify: cluster.skipTLSVerify,
        };
      }
    }

    // Test each strategy (without actually connecting)
    diagnostics.strategies = this.strategies.map((strategy, index) => ({
      index: index + 1,
      name: this.getStrategyName(index),
      active: index === this.currentStrategy,
    }));

    return diagnostics;
  }

  // Test connection method
  async testConnection() {
    if (!this.connected) {
      return { success: false, error: 'Not connected to Kubernetes' };
    }
    
    try {
      console.log('Testing Kubernetes API connectivity...');
      const start = Date.now();
      const result = await this.k8sClient.listNamespace();
      const duration = Date.now() - start;
      
      return {
        success: true,
        namespaces: result.body.items.length,
        responseTime: `${duration}ms`,
        server: this.kc.getCurrentCluster()?.server || 'unknown',
        strategy: this.getStrategyName(this.currentStrategy),
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code || 'unknown',
        strategy: this.getStrategyName(this.currentStrategy),
      };
    }
  }

  // Gateway Management
  async getGateways(namespace = 'default') {
    if (!this.connected) {
      console.log('Not connected to Kubernetes, returning mock data');
      // Return mock data when not connected
      return [
        {
          id: 'mock-gateway-1',
          name: 'example-gateway',
          namespace: namespace,
          status: 'Ready',
          listeners: [
            { name: 'http', protocol: 'HTTP', port: 80 },
            { name: 'https', protocol: 'HTTPS', port: 443 }
          ],
          createdAt: new Date().toISOString()
        }
      ];
    }

    try {
      console.log(`Fetching gateways from namespace: ${namespace}`);
      const response = await this.customObjectsApi.listNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'gateways'
      );

      const gateways = response.body.items.map(gateway => ({
        id: gateway.metadata.uid,
        name: gateway.metadata.name,
        namespace: gateway.metadata.namespace,
        status: this.getGatewayStatus(gateway),
        listeners: gateway.spec.listeners || [],
        createdAt: gateway.metadata.creationTimestamp,
        rawConfig: gateway
      }));
      
      console.log(`Found ${gateways.length} gateways`);
      return gateways;
    } catch (error) {
      console.error('Error fetching gateways:', error);
      throw error;
    }
  }

  async createGateway(gatewaySpec, namespace = 'default') {
    if (!this.connected) {
      throw new Error('Not connected to Kubernetes cluster');
    }

    const gateway = {
      apiVersion: 'gateway.networking.k8s.io/v1beta1',
      kind: 'Gateway',
      metadata: {
        name: gatewaySpec.name,
        namespace: namespace,
        labels: gatewaySpec.labels || {}
      },
      spec: {
        gatewayClassName: gatewaySpec.gatewayClassName || 'envoy-gateway',
        listeners: gatewaySpec.listeners || []
      }
    };

    try {
      console.log(`Creating gateway: ${gatewaySpec.name} in namespace: ${namespace}`);
      const response = await this.customObjectsApi.createNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'gateways',
        gateway
      );
      console.log(`Gateway ${gatewaySpec.name} created successfully`);
      return response.body;
    } catch (error) {
      console.error('Error creating gateway:', error);
      throw error;
    }
  }

  async updateGateway(name, gatewaySpec, namespace = 'default') {
    if (!this.connected) {
      throw new Error('Not connected to Kubernetes cluster');
    }

    try {
      // Get existing gateway to preserve metadata
      const existingGateway = await this.customObjectsApi.getNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'gateways',
        name
      );

      const updatedGateway = {
        ...existingGateway.body,
        spec: {
          gatewayClassName: gatewaySpec.gatewayClassName || existingGateway.body.spec.gatewayClassName,
          listeners: gatewaySpec.listeners || existingGateway.body.spec.listeners
        }
      };

      const response = await this.customObjectsApi.replaceNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'gateways',
        name,
        updatedGateway
      );
      return response.body;
    } catch (error) {
      console.error('Error updating gateway:', error);
      throw error;
    }
  }

  async deleteGateway(name, namespace = 'default') {
    if (!this.connected) {
      throw new Error('Not connected to Kubernetes cluster');
    }

    try {
      await this.customObjectsApi.deleteNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'gateways',
        name
      );
      return { success: true };
    } catch (error) {
      console.error('Error deleting gateway:', error);
      throw error;
    }
  }

  // HTTPRoute Management
  async getHTTPRoutes(namespace = 'default') {
    if (!this.connected) {
      console.log('Not connected to Kubernetes, returning mock data');
      return [
        {
          id: 'mock-route-1',
          name: 'example-route',
          namespace: namespace,
          parentRefs: [{ name: 'example-gateway', namespace: namespace }],
          hostnames: ['example.com'],
          rules: [
            {
              matches: [{ path: { type: 'PathPrefix', value: '/' } }],
              backendRefs: [{ name: 'example-service', port: 8080 }]
            }
          ],
          status: 'Accepted',
          createdAt: new Date().toISOString()
        }
      ];
    }

    try {
      console.log(`Fetching HTTPRoutes from namespace: ${namespace}`);
      const response = await this.customObjectsApi.listNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'httproutes'
      );

      const routes = response.body.items.map(route => ({
        id: route.metadata.uid,
        name: route.metadata.name,
        namespace: route.metadata.namespace,
        parentRefs: route.spec.parentRefs || [],
        hostnames: route.spec.hostnames || [],
        rules: route.spec.rules || [],
        status: this.getRouteStatus(route),
        createdAt: route.metadata.creationTimestamp,
        rawConfig: route
      }));
      
      console.log(`Found ${routes.length} HTTPRoutes`);
      return routes;
    } catch (error) {
      console.error('Error fetching HTTPRoutes:', error);
      throw error;
    }
  }

  async createHTTPRoute(routeSpec, namespace = 'default') {
    if (!this.connected) {
      throw new Error('Not connected to Kubernetes cluster');
    }

    const httpRoute = {
      apiVersion: 'gateway.networking.k8s.io/v1beta1',
      kind: 'HTTPRoute',
      metadata: {
        name: routeSpec.name,
        namespace: namespace,
        labels: routeSpec.labels || {}
      },
      spec: {
        parentRefs: routeSpec.parentRefs || [],
        hostnames: routeSpec.hostnames || [],
        rules: routeSpec.rules || []
      }
    };

    try {
      console.log(`Creating HTTPRoute: ${routeSpec.name} in namespace: ${namespace}`);
      const response = await this.customObjectsApi.createNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'httproutes',
        httpRoute
      );
      console.log(`HTTPRoute ${routeSpec.name} created successfully`);
      return response.body;
    } catch (error) {
      console.error('Error creating HTTPRoute:', error);
      throw error;
    }
  }

  async updateHTTPRoute(name, routeSpec, namespace = 'default') {
    if (!this.connected) {
      throw new Error('Not connected to Kubernetes cluster');
    }

    try {
      const existingRoute = await this.customObjectsApi.getNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'httproutes',
        name
      );

      const updatedRoute = {
        ...existingRoute.body,
        spec: {
          parentRefs: routeSpec.parentRefs || existingRoute.body.spec.parentRefs,
          hostnames: routeSpec.hostnames || existingRoute.body.spec.hostnames,
          rules: routeSpec.rules || existingRoute.body.spec.rules
        }
      };

      const response = await this.customObjectsApi.replaceNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'httproutes',
        name,
        updatedRoute
      );
      return response.body;
    } catch (error) {
      console.error('Error updating HTTPRoute:', error);
      throw error;
    }
  }

  async deleteHTTPRoute(name, namespace = 'default') {
    if (!this.connected) {
      throw new Error('Not connected to Kubernetes cluster');
    }

    try {
      await this.customObjectsApi.deleteNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'httproutes',
        name
      );
      return { success: true };
    } catch (error) {
      console.error('Error deleting HTTPRoute:', error);
      throw error;
    }
  }

  // Helper methods
  getGatewayStatus(gateway) {
    if (!gateway.status || !gateway.status.conditions) {
      return 'Unknown';
    }

    const readyCondition = gateway.status.conditions.find(
      condition => condition.type === 'Ready'
    );

    if (readyCondition) {
      return readyCondition.status === 'True' ? 'Ready' : 'Not Ready';
    }

    const acceptedCondition = gateway.status.conditions.find(
      condition => condition.type === 'Accepted'
    );

    if (acceptedCondition) {
      return acceptedCondition.status === 'True' ? 'Accepted' : 'Not Accepted';
    }

    return 'Unknown';
  }

  getRouteStatus(route) {
    if (!route.status || !route.status.conditions) {
      return 'Unknown';
    }

    const acceptedCondition = route.status.conditions.find(
      condition => condition.type === 'Accepted'
    );

    if (acceptedCondition) {
      return acceptedCondition.status === 'True' ? 'Accepted' : 'Not Accepted';
    }

    return 'Unknown';
  }

  // Envoy Gateway Management
  async deployEnvoyGateway(namespace = 'envoy-gateway-system') {
    if (!this.connected) {
      console.log('Not connected to Kubernetes, simulating deployment');
      return {
        status: 'simulated',
        message: 'Envoy Gateway deployment simulated (not connected to K8s)',
        deploymentId: `deploy-${Date.now()}`,
        namespace: namespace
      };
    }

    try {
      // Check if EnvoyGateway is already installed
      const existingInstallation = await this.checkEnvoyGatewayInstallation(namespace);
      
      if (existingInstallation) {
        return {
          status: 'already_installed',
          message: 'Envoy Gateway is already installed',
          namespace: namespace
        };
      }

      // Create the EnvoyGateway custom resource
      const envoyGateway = {
        apiVersion: 'config.gateway.envoyproxy.io/v1alpha1',
        kind: 'EnvoyGateway',
        metadata: {
          name: 'envoy-gateway',
          namespace: namespace
        },
        spec: {
          gateway: {
            controllerName: 'gateway.envoyproxy.io/gatewayclass-controller'
          }
        }
      };

      const response = await this.customObjectsApi.createNamespacedCustomObject(
        'config.gateway.envoyproxy.io',
        'v1alpha1',
        namespace,
        'envoygateways',
        envoyGateway
      );

      return {
        status: 'success',
        message: 'Envoy Gateway deployment initiated',
        deploymentId: `deploy-${Date.now()}`,
        namespace: namespace,
        gatewayResource: response.body
      };
    } catch (error) {
      console.error('Error deploying Envoy Gateway:', error);
      throw error;
    }
  }

  async checkEnvoyGatewayInstallation(namespace = 'envoy-gateway-system') {
    try {
      const response = await this.customObjectsApi.listNamespacedCustomObject(
        'config.gateway.envoyproxy.io',
        'v1alpha1',
        namespace,
        'envoygateways'
      );
      return response.body.items.length > 0;
    } catch (error) {
      // If the CRD doesn't exist, Envoy Gateway is not installed
      return false;
    }
  }

  // Namespace management
  async getNamespaces() {
    if (!this.connected) {
      throw new Error('Not connected to Kubernetes cluster');
    }

    try {
      const response = await this.k8sClient.listNamespace();
      return response.body.items.map(ns => ({
        name: ns.metadata.name,
        createdAt: ns.metadata.creationTimestamp,
        status: ns.status.phase
      }));
    } catch (error) {
      console.error('Error fetching namespaces:', error);
      throw error;
    }
  }

  // Service discovery
  async getServices(namespace = 'default') {
    if (!this.connected) {
      throw new Error('Not connected to Kubernetes cluster');
    }

    try {
      const response = await this.k8sClient.listNamespacedService(namespace);
      return response.body.items.map(service => ({
        name: service.metadata.name,
        namespace: service.metadata.namespace,
        type: service.spec.type,
        ports: service.spec.ports || [],
        clusterIP: service.spec.clusterIP
      }));
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }
}

module.exports = KubernetesService;