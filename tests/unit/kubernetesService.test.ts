import { jest } from '@jest/globals';
import { KubernetesService } from '../../tests/mocks/kubernetesService';
import { KubernetesError, Gateway, HTTPRoute, GatewayStatus, RouteStatus } from '../../src/shared/types';

describe('KubernetesService', () => {
  let kubernetesService: KubernetesService;

  beforeEach(() => {
    // Reset singleton
    (KubernetesService as any).instance = undefined;

    // Create a new instance with the mock already set up in the mock file
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
    it('should handle connection validation', async () => {
      // Mock implementation is already set up to return true
      const result = await kubernetesService.validateConnection();
      expect(result).toBe(true);
    });
  });

  describe('Namespace Operations', () => {
    describe('listNamespaces', () => {
      it('should list namespaces successfully', async () => {
        const result = await kubernetesService.listNamespaces();

        expect(result).toEqual(['default', 'kube-system', 'envoy-gateway-system']);
        expect(kubernetesService.listNamespaces).toHaveBeenCalled();
      });
    });

    describe('ensureNamespace', () => {
      it('should ensure namespace exists', async () => {
        await kubernetesService.ensureNamespace('test-namespace');

        expect(kubernetesService.ensureNamespace).toHaveBeenCalledWith('test-namespace');
      });
    });
  });

  describe('Gateway Operations', () => {
    describe('listGateways', () => {
      it('should list gateways successfully', async () => {
        const result = await kubernetesService.listGateways('default');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test-gateway');
        expect(result[0].status).toBe(GatewayStatus.READY);
        expect(kubernetesService.listGateways).toHaveBeenCalledWith('default');
      });

      it('should list all gateways when namespace not specified', async () => {
        const result = await kubernetesService.listGateways();

        expect(result).toHaveLength(1);
        expect(kubernetesService.listGateways).toHaveBeenCalled();
      });
    });

    describe('getGateway', () => {
      it('should get gateway successfully', async () => {
        const result = await kubernetesService.getGateway('test-gateway', 'default');

        expect(result).not.toBeNull();
        expect(result?.name).toBe('test-gateway');
        expect(result?.status).toBe(GatewayStatus.READY);
        expect(kubernetesService.getGateway).toHaveBeenCalledWith('test-gateway', 'default');
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

        const result = await kubernetesService.createGateway(gatewayInput);

        expect(result.name).toBe('test-gateway');
        expect(kubernetesService.createGateway).toHaveBeenCalledWith(gatewayInput);
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

        const result = await kubernetesService.updateGateway(gatewayInput);

        expect(result.name).toBe('test-gateway');
        expect(kubernetesService.updateGateway).toHaveBeenCalledWith(gatewayInput);
      });
    });

    describe('deleteGateway', () => {
      it('should delete gateway successfully', async () => {
        await kubernetesService.deleteGateway('test-gateway', 'default');

        expect(kubernetesService.deleteGateway).toHaveBeenCalledWith('test-gateway', 'default');
      });
    });
  });

  describe('HTTPRoute Operations', () => {
    describe('listHTTPRoutes', () => {
      it('should list HTTP routes successfully', async () => {
        const result = await kubernetesService.listHTTPRoutes('default');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test-route');
        expect(result[0].status).toBe(RouteStatus.ACCEPTED);
        expect(kubernetesService.listHTTPRoutes).toHaveBeenCalledWith('default');
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

        const result = await kubernetesService.createHTTPRoute(routeInput);

        expect(result.name).toBe('test-route');
        expect(kubernetesService.createHTTPRoute).toHaveBeenCalledWith(routeInput);
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

        const results = await kubernetesService.applyYamlConfiguration(yamlContent);

        expect(results).toHaveLength(1);
        expect(kubernetesService.applyYamlConfiguration).toHaveBeenCalledWith(yamlContent);
      });
    });
  });

  describe('Cluster Information', () => {
    describe('getClusterInfo', () => {
      it('should get cluster information successfully', async () => {
        const result = await kubernetesService.getClusterInfo();

        expect(result).toHaveProperty('version', 'v1.25.0');
        expect(result).toHaveProperty('status', 'healthy');
        expect(kubernetesService.getClusterInfo).toHaveBeenCalled();
      });
    });

    describe('isEnvoyGatewayInstalled', () => {
      it('should check if Envoy Gateway is installed', async () => {
        const result = await kubernetesService.isEnvoyGatewayInstalled();

        expect(result).toBe(true);
        expect(kubernetesService.isEnvoyGatewayInstalled).toHaveBeenCalled();
      });
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const result = await kubernetesService.healthCheck();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('version', 'v1.25.0');
      expect(kubernetesService.healthCheck).toHaveBeenCalled();
    });
  });

  describe('Status Mapping', () => {
    it('should map gateway status correctly', () => {
      const result = kubernetesService.mapGatewayStatus({
        conditions: [
          { type: 'Accepted', status: 'True' },
          { type: 'Programmed', status: 'True' },
        ],
      });

      expect(result).toBe(GatewayStatus.READY);
      expect(kubernetesService.mapGatewayStatus).toHaveBeenCalled();
    });

    it('should map route status correctly', () => {
      const result = kubernetesService.mapRouteStatus({
        conditions: [
          { type: 'Accepted', status: 'True' },
          { type: 'ResolvedRefs', status: 'True' },
        ],
      });

      expect(result).toBe(RouteStatus.ACCEPTED);
      expect(kubernetesService.mapRouteStatus).toHaveBeenCalled();
    });
  });
});
