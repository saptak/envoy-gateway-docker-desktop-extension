import { jest } from '@jest/globals';
import { KubernetesService } from '../../src/backend/services/kubernetesService';
import { KubernetesError, Gateway, HTTPRoute, GatewayStatus, RouteStatus } from '../../src/shared/types';
import * as k8s from '@kubernetes/client-node';

// Mock @kubernetes/client-node
jest.mock('@kubernetes/client-node', () => ({
  KubeConfig: jest.fn().mockImplementation(() => ({
    loadFromDefault: jest.fn(),
    makeApiClient: jest.fn(),
  })),
  KubernetesApi: jest.fn(),
  CoreV1Api: jest.fn(),
  CustomObjectsApi: jest.fn(),
  AppsV1Api: jest.fn(),
}));

describe('KubernetesService', () => {
  let kubernetesService: KubernetesService;
  let mockKubeConfig: any;
  let mockCoreV1Api: any;
  let mockCustomObjectsApi: any;
  let mockAppsV1Api: any;
  let mockK8sApi: any;

  beforeEach(() => {
    // Reset singleton
    (KubernetesService as any).instance = undefined;
    
    // Setup mocks
    mockCoreV1Api = {
      listNamespaces: jest.fn(),
      readNamespace: jest.fn(),
      createNamespace: jest.fn(),
      readNamespacedConfigMap: jest.fn(),
      createNamespacedConfigMap: jest.fn(),
      replaceNamespacedConfigMap: jest.fn(),
    };
    
    mockCustomObjectsApi = {
      listNamespacedCustomObject: jest.fn(),
      listClusterCustomObject: jest.fn(),
      getNamespacedCustomObject: jest.fn(),
      createNamespacedCustomObject: jest.fn(),
      replaceNamespacedCustomObject: jest.fn(),
      deleteNamespacedCustomObject: jest.fn(),
    };
    
    mockAppsV1Api = {
      listNamespacedDeployment: jest.fn(),
    };
    
    mockK8sApi = {
      getCodeVersion: jest.fn(),
    };
    
    mockKubeConfig = {
      loadFromDefault: jest.fn(),
      makeApiClient: jest.fn().mockImplementation((apiClass) => {
        if (apiClass === k8s.CoreV1Api) return mockCoreV1Api;
        if (apiClass === k8s.CustomObjectsApi) return mockCustomObjectsApi;
        if (apiClass === k8s.AppsV1Api) return mockAppsV1Api;
        if (apiClass === k8s.KubernetesApi) return mockK8sApi;
      }),
    };
    
    (k8s.KubeConfig as jest.Mock).mockImplementation(() => mockKubeConfig);
    
    kubernetesService = KubernetesService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const service1 = KubernetesService.getInstance();
      const service2 = KubernetesService.getInstance();
      
      expect(service1).toBe(service2);
      expect(service1).toBeInstanceOf(KubernetesService);
    });
  });

  describe('Connection Validation', () => {
    it('should validate connection on initialization', async () => {
      mockCoreV1Api.listNamespaces.mockResolvedValue({ body: { items: [] } });
      
      // Create new instance to trigger validation
      (KubernetesService as any).instance = undefined;
      kubernetesService = KubernetesService.getInstance();
      
      // Wait for validation to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockCoreV1Api.listNamespaces).toHaveBeenCalled();
    });

    it('should throw KubernetesError if connection fails', async () => {
      mockCoreV1Api.listNamespaces.mockRejectedValue(new Error('Connection failed'));
      
      expect(() => {
        (KubernetesService as any).instance = undefined;
        KubernetesService.getInstance();
      }).toThrow(KubernetesError);
    });
  });

  describe('Namespace Operations', () => {
    describe('listNamespaces', () => {
      it('should list namespaces successfully', async () => {
        const mockNamespaces = {
          body: {
            items: [
              { metadata: { name: 'default' } },
              { metadata: { name: 'kube-system' } },
              { metadata: { name: 'envoy-gateway-system' } },
            ],
          },
        };
        
        mockCoreV1Api.listNamespaces.mockResolvedValue(mockNamespaces);
        
        const result = await kubernetesService.listNamespaces();
        
        expect(result).toEqual(['default', 'kube-system', 'envoy-gateway-system']);
      });

      it('should handle list namespaces error', async () => {
        mockCoreV1Api.listNamespaces.mockRejectedValue(new Error('List failed'));
        
        await expect(kubernetesService.listNamespaces()).rejects.toThrow(KubernetesError);
      });
    });

    describe('ensureNamespace', () => {
      it('should not create namespace if it already exists', async () => {
        mockCoreV1Api.readNamespace.mockResolvedValue({ body: { metadata: { name: 'existing' } } });
        
        await kubernetesService.ensureNamespace('existing');
        
        expect(mockCoreV1Api.readNamespace).toHaveBeenCalledWith('existing');
        expect(mockCoreV1Api.createNamespace).not.toHaveBeenCalled();
      });

      it('should create namespace if it does not exist', async () => {
        mockCoreV1Api.readNamespace.mockRejectedValue({ statusCode: 404 });
        mockCoreV1Api.createNamespace.mockResolvedValue({ body: {} });
        
        await kubernetesService.ensureNamespace('new-namespace');
        
        expect(mockCoreV1Api.readNamespace).toHaveBeenCalledWith('new-namespace');
        expect(mockCoreV1Api.createNamespace).toHaveBeenCalledWith({
          metadata: { name: 'new-namespace' },
        });
      });

      it('should handle create namespace error', async () => {
        mockCoreV1Api.readNamespace.mockRejectedValue({ statusCode: 404 });
        mockCoreV1Api.createNamespace.mockRejectedValue(new Error('Create failed'));
        
        await expect(kubernetesService.ensureNamespace('new-namespace')).rejects.toThrow(KubernetesError);
      });
    });
  });

  describe('Gateway Operations', () => {
    const mockGatewayResource = {
      apiVersion: 'gateway.networking.k8s.io/v1beta1',
      kind: 'Gateway',
      metadata: {
        name: 'test-gateway',
        namespace: 'default',
        uid: 'gateway-uid',
        creationTimestamp: '2023-01-01T00:00:00Z',
      },
      spec: {
        gatewayClassName: 'test-class',
        listeners: [
          {
            name: 'http',
            port: 8080,
            protocol: 'HTTP',
          },
        ],
      },
      status: {
        conditions: [
          {
            type: 'Accepted',
            status: 'True',
            reason: 'Accepted',
            message: 'Gateway accepted',
            lastTransitionTime: '2023-01-01T00:00:00Z',
          },
          {
            type: 'Programmed',
            status: 'True',
            reason: 'Programmed',
            message: 'Gateway programmed',
            lastTransitionTime: '2023-01-01T00:00:00Z',
          },
        ],
        listeners: [
          {
            name: 'http',
            port: 8080,
            protocol: 'HTTP',
            attachedRoutes: 1,
            conditions: [],
          },
        ],
      },
    };

    describe('listGateways', () => {
      it('should list gateways successfully', async () => {
        mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
          body: { items: [mockGatewayResource] },
        });
        
        const result = await kubernetesService.listGateways('default');
        
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test-gateway');
        expect(result[0].status).toBe(GatewayStatus.READY);
      });

      it('should list all gateways when namespace not specified', async () => {
        mockCustomObjectsApi.listClusterCustomObject.mockResolvedValue({
          body: { items: [mockGatewayResource] },
        });
        
        const result = await kubernetesService.listGateways();
        
        expect(result).toHaveLength(1);
        expect(mockCustomObjectsApi.listClusterCustomObject).toHaveBeenCalled();
      });
    });

    describe('getGateway', () => {
      it('should get gateway successfully', async () => {
        mockCustomObjectsApi.getNamespacedCustomObject.mockResolvedValue({
          body: mockGatewayResource,
        });
        
        const result = await kubernetesService.getGateway('test-gateway', 'default');
        
        expect(result).not.toBeNull();
        expect(result?.name).toBe('test-gateway');
        expect(result?.status).toBe(GatewayStatus.READY);
      });

      it('should return null for non-existent gateway', async () => {
        mockCustomObjectsApi.getNamespacedCustomObject.mockRejectedValue({ statusCode: 404 });
        
        const result = await kubernetesService.getGateway('non-existent', 'default');
        
        expect(result).toBeNull();
      });
    });

    describe('createGateway', () => {
      it('should create gateway successfully', async () => {
        const gatewayInput: Gateway = {
          id: '',
          name: 'test-gateway',
          namespace: 'default',
          status: GatewayStatus.PENDING,
          listeners: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          spec: {
            gatewayClassName: 'test-class',
            listeners: [
              {
                name: 'http',
                port: 8080,
                protocol: 'HTTP',
              },
            ],
          },
        };
        
        mockCustomObjectsApi.createNamespacedCustomObject.mockResolvedValue({
          body: mockGatewayResource,
        });
        
        const result = await kubernetesService.createGateway(gatewayInput);
        
        expect(result.name).toBe('test-gateway');
        expect(mockCustomObjectsApi.createNamespacedCustomObject).toHaveBeenCalledWith(
          'gateway.networking.k8s.io',
          'v1beta1',
          'default',
          'gateways',
          expect.objectContaining({
            metadata: { name: 'test-gateway', namespace: 'default' },
          })
        );
      });
    });

    describe('updateGateway', () => {
      it('should update gateway successfully', async () => {
        const gatewayInput: Gateway = {
          id: 'gateway-uid',
          name: 'test-gateway',
          namespace: 'default',
          status: GatewayStatus.READY,
          listeners: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          spec: {
            gatewayClassName: 'test-class',
            listeners: [
              {
                name: 'http',
                port: 8080,
                protocol: 'HTTP',
              },
            ],
          },
        };
        
        mockCustomObjectsApi.replaceNamespacedCustomObject.mockResolvedValue({
          body: mockGatewayResource,
        });
        
        const result = await kubernetesService.updateGateway(gatewayInput);
        
        expect(result.name).toBe('test-gateway');
      });
    });

    describe('deleteGateway', () => {
      it('should delete gateway successfully', async () => {
        mockCustomObjectsApi.deleteNamespacedCustomObject.mockResolvedValue({});
        
        await kubernetesService.deleteGateway('test-gateway', 'default');
        
        expect(mockCustomObjectsApi.deleteNamespacedCustomObject).toHaveBeenCalledWith(
          'gateway.networking.k8s.io',
          'v1beta1',
          'default',
          'gateways',
          'test-gateway'
        );
      });
    });
  });

  describe('HTTPRoute Operations', () => {
    const mockRouteResource = {
      apiVersion: 'gateway.networking.k8s.io/v1beta1',
      kind: 'HTTPRoute',
      metadata: {
        name: 'test-route',
        namespace: 'default',
        uid: 'route-uid',
        creationTimestamp: '2023-01-01T00:00:00Z',
      },
      spec: {
        parentRefs: [
          {
            name: 'test-gateway',
            namespace: 'default',
          },
        ],
        rules: [
          {
            matches: [
              {
                path: {
                  type: 'PathPrefix',
                  value: '/api',
                },
              },
            ],
            backendRefs: [
              {
                name: 'test-service',
                port: 8080,
              },
            ],
          },
        ],
      },
      status: {
        conditions: [
          {
            type: 'Accepted',
            status: 'True',
            reason: 'Accepted',
            message: 'Route accepted',
            lastTransitionTime: '2023-01-01T00:00:00Z',
          },
          {
            type: 'ResolvedRefs',
            status: 'True',
            reason: 'ResolvedRefs',
            message: 'References resolved',
            lastTransitionTime: '2023-01-01T00:00:00Z',
          },
        ],
      },
    };

    describe('listHTTPRoutes', () => {
      it('should list HTTP routes successfully', async () => {
        mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
          body: { items: [mockRouteResource] },
        });
        
        const result = await kubernetesService.listHTTPRoutes('default');
        
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test-route');
        expect(result[0].status).toBe(RouteStatus.ACCEPTED);
      });
    });

    describe('createHTTPRoute', () => {
      it('should create HTTP route successfully', async () => {
        const routeInput: HTTPRoute = {
          id: '',
          name: 'test-route',
          namespace: 'default',
          status: RouteStatus.PENDING,
          parentRefs: [
            {
              name: 'test-gateway',
              namespace: 'default',
            },
          ],
          rules: [
            {
              backendRefs: [
                {
                  name: 'test-service',
                  port: 8080,
                },
              ],
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        mockCustomObjectsApi.createNamespacedCustomObject.mockResolvedValue({
          body: mockRouteResource,
        });
        
        const result = await kubernetesService.createHTTPRoute(routeInput);
        
        expect(result.name).toBe('test-route');
      });
    });
  });

  describe('YAML Configuration', () => {
    describe('applyYamlConfiguration', () => {
      it('should apply YAML configuration successfully', async () => {
        const yamlContent = `
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: test-gateway
  namespace: default
spec:
  gatewayClassName: test-class
  listeners:
  - name: http
    port: 8080
    protocol: HTTP
`;
        
        mockCustomObjectsApi.getNamespacedCustomObject.mockRejectedValue({ statusCode: 404 });
        mockCustomObjectsApi.createNamespacedCustomObject.mockResolvedValue({
          body: mockGatewayResource,
        });
        
        const results = await kubernetesService.applyYamlConfiguration(yamlContent);
        
        expect(results).toHaveLength(1);
        expect(mockCustomObjectsApi.createNamespacedCustomObject).toHaveBeenCalled();
      });

      it('should handle YAML parsing error', async () => {
        const invalidYaml = 'invalid: yaml: content:';
        
        await expect(kubernetesService.applyYamlConfiguration(invalidYaml))
          .rejects.toThrow(KubernetesError);
      });
    });
  });

  describe('Cluster Information', () => {
    describe('getClusterInfo', () => {
      it('should get cluster information successfully', async () => {
        mockK8sApi.getCodeVersion.mockResolvedValue({
          body: {
            gitVersion: 'v1.25.0',
            platform: 'linux/amd64',
          },
        });
        
        mockCoreV1Api.listNodes.mockResolvedValue({
          body: {
            items: [
              {
                metadata: { name: 'node1' },
                status: {
                  conditions: [
                    { type: 'Ready', status: 'True' },
                  ],
                  nodeInfo: {
                    kubeletVersion: 'v1.25.0',
                  },
                },
              },
            ],
          },
        });
        
        const result = await kubernetesService.getClusterInfo();
        
        expect(result.version.gitVersion).toBe('v1.25.0');
        expect(result.nodeCount).toBe(1);
        expect(result.nodes[0].name).toBe('node1');
        expect(result.nodes[0].status).toBe('Ready');
      });
    });

    describe('isEnvoyGatewayInstalled', () => {
      it('should return true when Envoy Gateway is installed', async () => {
        mockAppsV1Api.listNamespacedDeployment.mockResolvedValue({
          body: {
            items: [
              {
                metadata: { name: 'envoy-gateway' },
              },
            ],
          },
        });
        
        const result = await kubernetesService.isEnvoyGatewayInstalled();
        
        expect(result).toBe(true);
      });

      it('should return false when Envoy Gateway is not installed', async () => {
        mockAppsV1Api.listNamespacedDeployment.mockResolvedValue({
          body: { items: [] },
        });
        
        const result = await kubernetesService.isEnvoyGatewayInstalled();
        
        expect(result).toBe(false);
      });

      it('should return false when namespace does not exist', async () => {
        mockAppsV1Api.listNamespacedDeployment.mockRejectedValue({ statusCode: 404 });
        
        const result = await kubernetesService.isEnvoyGatewayInstalled();
        
        expect(result).toBe(false);
      });
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when Kubernetes is accessible', async () => {
      mockK8sApi.getCodeVersion.mockResolvedValue({
        body: { gitVersion: 'v1.25.0', platform: 'linux/amd64' },
      });
      
      mockCoreV1Api.listNamespaces.mockResolvedValue({
        body: { items: [{ metadata: { name: 'default' } }] },
      });
      
      mockAppsV1Api.listNamespacedDeployment.mockResolvedValue({
        body: { items: [{ metadata: { name: 'envoy-gateway' } }] },
      });
      
      const result = await kubernetesService.healthCheck();
      
      expect(result.status).toBe('healthy');
      expect(result.version).toBe('v1.25.0');
      expect(result.details?.envoyGatewayInstalled).toBe(true);
    });

    it('should return unhealthy status when Kubernetes is not accessible', async () => {
      mockK8sApi.getCodeVersion.mockRejectedValue(new Error('Connection failed'));
      
      const result = await kubernetesService.healthCheck();
      
      expect(result.status).toBe('unhealthy');
      expect(result.details?.error).toBe('Connection failed');
    });
  });

  describe('Status Mapping', () => {
    it('should map gateway status correctly', () => {
      // Test READY status
      const readyGateway = {
        ...mockGatewayResource,
        status: {
          conditions: [
            { type: 'Accepted', status: 'True' },
            { type: 'Programmed', status: 'True' },
          ],
        },
      };
      
      mockCustomObjectsApi.getNamespacedCustomObject.mockResolvedValue({
        body: readyGateway,
      });
      
      // Test FAILED status
      const failedGateway = {
        ...mockGatewayResource,
        status: {
          conditions: [
            { type: 'Accepted', status: 'False', reason: 'Invalid' },
          ],
        },
      };
      
      mockCustomObjectsApi.getNamespacedCustomObject.mockResolvedValue({
        body: failedGateway,
      });
      
      // Test PENDING status
      const pendingGateway = {
        ...mockGatewayResource,
        status: {
          conditions: [
            { type: 'Accepted', status: 'True' },
            { type: 'Programmed', status: 'False' },
          ],
        },
      };
      
      mockCustomObjectsApi.getNamespacedCustomObject.mockResolvedValue({
        body: pendingGateway,
      });
    });

    it('should map route status correctly', () => {
      // Test ACCEPTED status
      const acceptedRoute = {
        ...mockRouteResource,
        status: {
          conditions: [
            { type: 'Accepted', status: 'True' },
            { type: 'ResolvedRefs', status: 'True' },
          ],
        },
      };
      
      mockCustomObjectsApi.getNamespacedCustomObject.mockResolvedValue({
        body: acceptedRoute,
      });
      
      // Test FAILED status
      const failedRoute = {
        ...mockRouteResource,
        status: {
          conditions: [
            { type: 'Accepted', status: 'False', reason: 'Invalid' },
          ],
        },
      };
      
      mockCustomObjectsApi.getNamespacedCustomObject.mockResolvedValue({
        body: failedRoute,
      });
    });
  });
});
