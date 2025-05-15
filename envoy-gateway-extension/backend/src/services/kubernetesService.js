const k8s = require('@kubernetes/client-node');
const yaml = require('js-yaml');
const _ = require('lodash');

class KubernetesService {
  constructor() {
    this.kc = new k8s.KubeConfig();
    this.k8sClient = null;
    this.customObjectsApi = null;
    this.connected = false;
    
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      // Try to load from default kubeconfig
      this.kc.loadFromDefault();
      
      this.k8sClient = this.kc.makeApiClient(k8s.CoreV1Api);
      this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
      
      // Test connection
      await this.k8sClient.listNamespaces();
      this.connected = true;
      console.log('Successfully connected to Kubernetes cluster');
    } catch (error) {
      console.error('Failed to connect to Kubernetes:', error.message);
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  // Gateway Management
  async getGateways(namespace = 'default') {
    if (!this.connected) {
      throw new Error('Not connected to Kubernetes cluster');
    }

    try {
      const response = await this.customObjectsApi.listNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'gateways'
      );

      return response.body.items.map(gateway => ({
        id: gateway.metadata.uid,
        name: gateway.metadata.name,
        namespace: gateway.metadata.namespace,
        status: this.getGatewayStatus(gateway),
        listeners: gateway.spec.listeners || [],
        createdAt: gateway.metadata.creationTimestamp,
        rawConfig: gateway
      }));
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
      const response = await this.customObjectsApi.createNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'gateways',
        gateway
      );
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
      throw new Error('Not connected to Kubernetes cluster');
    }

    try {
      const response = await this.customObjectsApi.listNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
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
        status: this.getRouteStatus(route),
        createdAt: route.metadata.creationTimestamp,
        rawConfig: route
      }));
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
      const response = await this.customObjectsApi.createNamespacedCustomObject(
        'gateway.networking.k8s.io',
        'v1beta1',
        namespace,
        'httproutes',
        httpRoute
      );
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
      throw new Error('Not connected to Kubernetes cluster');
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
      const response = await this.k8sClient.listNamespaces();
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