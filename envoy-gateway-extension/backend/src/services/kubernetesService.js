const k8s = require('@kubernetes/client-node');
const yaml = require('js-yaml');

class KubernetesService {
  constructor() {
    this.kc = new k8s.KubeConfig();
    this.k8sApi = null;
    this.customObjectsApi = null;
    this.isConnected = false;
    
    this.init();
  }

  async init() {
    try {
      // Load kubeconfig from default location or in-cluster config
      if (process.env.KUBECONFIG) {
        this.kc.loadFromFile(process.env.KUBECONFIG);
      } else if (process.env.KUBERNETES_SERVICE_HOST) {
        this.kc.loadFromCluster();
      } else {
        this.kc.loadFromDefault();
      }

      this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
      this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
      
      // Test connection
      await this.testConnection();
      this.isConnected = true;
      console.log('Successfully connected to Kubernetes cluster');
    } catch (error) {
      console.error('Failed to connect to Kubernetes:', error.message);
      this.isConnected = false;
    }
  }

  async testConnection() {
    try {
      await this.k8sApi.listNamespace();
      return true;
    } catch (error) {
      throw new Error(`Kubernetes connection test failed: ${error.message}`);
    }
  }

  async getGateways(namespace = 'default') {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      const response = await this.customObjectsApi.listNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        namespace,
        'gateways'
      );

      return response.body.items.map(gateway => ({
        id: gateway.metadata.uid,
        name: gateway.metadata.name,
        namespace: gateway.metadata.namespace,
        status: this.parseGatewayStatus(gateway.status),
        listeners: gateway.spec.listeners || [],
        addresses: gateway.status?.addresses || [],
        createdAt: gateway.metadata.creationTimestamp,
        spec: gateway.spec,
        raw: gateway
      }));
    } catch (error) {
      // Return empty array if Gateways CRD doesn't exist (Envoy Gateway not installed)
      if (error.statusCode === 404) {
        return [];
      }
      throw error;
    }
  }

  async createGateway(namespace = 'default', gatewaySpec) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      const gateway = {
        apiVersion: 'gateway.networking.k8s.io/v1',
        kind: 'Gateway',
        metadata: {
          name: gatewaySpec.name,
          namespace: namespace
        },
        spec: {
          gatewayClassName: gatewaySpec.gatewayClassName || 'envoy-gateway',
          listeners: gatewaySpec.listeners || []
        }
      };

      const response = await this.customObjectsApi.createNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        namespace,
        'gateways',
        gateway
      );

      return {
        id: response.body.metadata.uid,
        name: response.body.metadata.name,
        namespace: response.body.metadata.namespace,
        status: 'Pending',
        listeners: response.body.spec.listeners || [],
        createdAt: response.body.metadata.creationTimestamp,
        spec: response.body.spec
      };
    } catch (error) {
      throw new Error(`Failed to create gateway: ${error.message}`);
    }
  }

  async updateGateway(namespace = 'default', name, gatewaySpec) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      // Get existing gateway
      const existing = await this.customObjectsApi.getNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        namespace,
        'gateways',
        name
      );

      // Update spec
      existing.body.spec = {
        ...existing.body.spec,
        ...gatewaySpec
      };

      const response = await this.customObjectsApi.replaceNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        namespace,
        'gateways',
        name,
        existing.body
      );

      return {
        id: response.body.metadata.uid,
        name: response.body.metadata.name,
        namespace: response.body.metadata.namespace,
        status: this.parseGatewayStatus(response.body.status),
        listeners: response.body.spec.listeners || [],
        createdAt: response.body.metadata.creationTimestamp,
        spec: response.body.spec
      };
    } catch (error) {
      throw new Error(`Failed to update gateway: ${error.message}`);
    }
  }

  async deleteGateway(namespace = 'default', name) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      await this.customObjectsApi.deleteNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        namespace,
        'gateways',
        name
      );

      return { success: true, message: `Gateway ${name} deleted successfully` };
    } catch (error) {
      throw new Error(`Failed to delete gateway: ${error.message}`);
    }
  }

  async getHTTPRoutes(namespace = 'default') {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      const response = await this.customObjectsApi.listNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        namespace,
        'httproutes'
      );

      return response.body.items.map(route => ({
        id: route.metadata.uid,
        name: route.metadata.name,
        namespace: route.metadata.namespace,
        parentRefs: route.spec.parentRefs || [],
        hostnames: route.spec.hostnames || [],
        rules: route.spec.rules || [],
        status: this.parseRouteStatus(route.status),
        createdAt: route.metadata.creationTimestamp,
        spec: route.spec,
        raw: route
      }));
    } catch (error) {
      // Return empty array if HTTPRoutes CRD doesn't exist
      if (error.statusCode === 404) {
        return [];
      }
      throw error;
    }
  }

  async createHTTPRoute(namespace = 'default', routeSpec) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      const httpRoute = {
        apiVersion: 'gateway.networking.k8s.io/v1',
        kind: 'HTTPRoute',
        metadata: {
          name: routeSpec.name,
          namespace: namespace
        },
        spec: {
          parentRefs: routeSpec.parentRefs || [],
          hostnames: routeSpec.hostnames || [],
          rules: routeSpec.rules || []
        }
      };

      const response = await this.customObjectsApi.createNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        namespace,
        'httproutes',
        httpRoute
      );

      return {
        id: response.body.metadata.uid,
        name: response.body.metadata.name,
        namespace: response.body.metadata.namespace,
        parentRefs: response.body.spec.parentRefs || [],
        hostnames: response.body.spec.hostnames || [],
        rules: response.body.spec.rules || [],
        status: 'Pending',
        createdAt: response.body.metadata.creationTimestamp,
        spec: response.body.spec
      };
    } catch (error) {
      throw new Error(`Failed to create HTTPRoute: ${error.message}`);
    }
  }

  async updateHTTPRoute(namespace = 'default', name, routeSpec) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      // Get existing route
      const existing = await this.customObjectsApi.getNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        namespace,
        'httproutes',
        name
      );

      // Update spec
      existing.body.spec = {
        ...existing.body.spec,
        ...routeSpec
      };

      const response = await this.customObjectsApi.replaceNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        namespace,
        'httproutes',
        name,
        existing.body
      );

      return {
        id: response.body.metadata.uid,
        name: response.body.metadata.name,
        namespace: response.body.metadata.namespace,
        parentRefs: response.body.spec.parentRefs || [],
        hostnames: response.body.spec.hostnames || [],
        rules: response.body.spec.rules || [],
        status: this.parseRouteStatus(response.body.status),
        createdAt: response.body.metadata.creationTimestamp,
        spec: response.body.spec
      };
    } catch (error) {
      throw new Error(`Failed to update HTTPRoute: ${error.message}`);
    }
  }

  async deleteHTTPRoute(namespace = 'default', name) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      await this.customObjectsApi.deleteNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        namespace,
        'httproutes',
        name
      );

      return { success: true, message: `HTTPRoute ${name} deleted successfully` };
    } catch (error) {
      throw new Error(`Failed to delete HTTPRoute: ${error.message}`);
    }
  }

  async getNamespaces() {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      const response = await this.k8sApi.listNamespace();
      return response.body.items.map(ns => ({
        name: ns.metadata.name,
        status: ns.status.phase,
        createdAt: ns.metadata.creationTimestamp
      }));
    } catch (error) {
      throw error;
    }
  }

  async deployEnvoyGateway() {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Kubernetes cluster');
      }

      // Check if Envoy Gateway is already installed
      const gatewayClasses = await this.customObjectsApi.listClusterCustomObject(
        'gateway.networking.k8s.io',
        'v1',
        'gatewayclasses'
      );

      const envoyGatewayClass = gatewayClasses.body.items.find(
        gc => gc.metadata.name === 'envoy-gateway'
      );

      if (envoyGatewayClass) {
        return {
          status: 'already-installed',
          message: 'Envoy Gateway is already installed',
          gatewayClass: envoyGatewayClass.metadata.name
        };
      }

      // This is a simplified deployment - in reality, you'd need to apply
      // the full Envoy Gateway YAML manifests
      return {
        status: 'installation-required',
        message: 'Envoy Gateway installation is required',
        instructions: 'Please run: kubectl apply -f https://github.com/envoyproxy/gateway/releases/download/v1.0.0/install.yaml'
      };
    } catch (error) {
      throw new Error(`Failed to check/deploy Envoy Gateway: ${error.message}`);
    }
  }

  parseGatewayStatus(status) {
    if (!status) return 'Unknown';
    
    if (status.conditions && status.conditions.length > 0) {
      const programmedCondition = status.conditions.find(c => c.type === 'Programmed');
      if (programmedCondition) {
        return programmedCondition.status === 'True' ? 'Ready' : 'Not Ready';
      }
    }
    
    return 'Pending';
  }

  parseRouteStatus(status) {
    if (!status) return 'Unknown';
    
    if (status.parents && status.parents.length > 0) {
      const parent = status.parents[0];
      if (parent.conditions && parent.conditions.length > 0) {
        const acceptedCondition = parent.conditions.find(c => c.type === 'Accepted');
        if (acceptedCondition) {
          return acceptedCondition.status === 'True' ? 'Accepted' : 'Rejected';
        }
      }
    }
    
    return 'Pending';
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      cluster: this.kc.getCurrentCluster()?.name || 'unknown',
      context: this.kc.getCurrentContext() || 'unknown'
    };
  }
}

module.exports = KubernetesService;