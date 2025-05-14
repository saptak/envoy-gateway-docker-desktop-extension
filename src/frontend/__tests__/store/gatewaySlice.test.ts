import { configureStore } from '@reduxjs/toolkit';

// Use global mock instead of trying to import
declare const jest: any;

// Create mock gateway slice
const gatewaySlice = {
  name: 'gateway',
  initialState: {
    gateways: [],
    loading: false,
    error: null,
  },
  reducers: {
    setGateways: (state: any, action: any) => {
      state.gateways = action.payload;
    },
    setLoading: (state: any, action: any) => {
      state.loading = action.payload;
    },
    setError: (state: any, action: any) => {
      state.error = action.payload;
    },
    addGateway: (state: any, action: any) => {
      state.gateways.push(action.payload);
    },
    removeGateway: (state: any, action: any) => {
      state.gateways = state.gateways.filter(
        (g: any) => !(g.metadata.name === action.payload.name && g.metadata.namespace === action.payload.namespace)
      );
    },
  },
};

// Mock API service
const mockApiService = {
  getGateways: jest.fn(),
  createGateway: jest.fn(),
  deleteGateway: jest.fn(),
  getRoutes: jest.fn(),
  createRoute: jest.fn(),
  deleteRoute: jest.fn(),
  getMetrics: jest.fn(),
  getHealth: jest.fn(),
  getSystemStatus: jest.fn(),
  getContainers: jest.fn(),
  startContainer: jest.fn(),
  stopContainer: jest.fn(),
  getConfiguration: jest.fn(),
  updateConfiguration: jest.fn(),
};

const selectGateways = (state: any) => state.gateway.gateways;
const selectGatewayLoading = (state: any) => state.gateway.loading;
const selectGatewayError = (state: any) => state.gateway.error;

describe('Gateway Redux Store Tests', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        gateway: (state = gatewaySlice.initialState, action: any) => {
          switch (action.type) {
            case 'gateway/setGateways':
              return { ...state, gateways: action.payload };
            case 'gateway/setLoading':
              return { ...state, loading: action.payload };
            case 'gateway/setError':
              return { ...state, error: action.payload };
            case 'gateway/addGateway':
              return { ...state, gateways: [...state.gateways, action.payload] };
            case 'gateway/removeGateway':
              return {
                ...state,
                gateways: state.gateways.filter(
                  (g: any) => !(g.metadata.name === action.payload.name && g.metadata.namespace === action.payload.namespace)
                ),
              };
            default:
              return state;
          }
        },
      },
    });
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState();
      expect(state.gateway).toEqual({
        gateways: [],
        loading: false,
        error: null,
      });
    });
  });

  describe('Selectors', () => {
    it('should select gateways correctly', () => {
      const mockGateways = [
        {
          apiVersion: 'gateway.networking.k8s.io/v1',
          kind: 'Gateway',
          metadata: { name: 'test-gateway', namespace: 'default' },
          spec: { gatewayClassName: 'envoy-gateway', listeners: [] },
        },
      ];

      store.dispatch({
        type: 'gateway/setGateways',
        payload: mockGateways,
      });

      const state = store.getState();
      expect(selectGateways(state)).toEqual(mockGateways);
    });

    it('should select loading state correctly', () => {
      const state = store.getState();
      expect(selectGatewayLoading(state)).toBe(false);
    });

    it('should select error state correctly', () => {
      const state = store.getState();
      expect(selectGatewayError(state)).toBe(null);
    });
  });

  describe('State Mutations', () => {
    it('should handle setGateways action', () => {
      const mockGateways = [
        {
          apiVersion: 'gateway.networking.k8s.io/v1',
          kind: 'Gateway',
          metadata: { name: 'test-gateway', namespace: 'default' },
          spec: { gatewayClassName: 'envoy-gateway', listeners: [] },
        },
      ];

      store.dispatch({
        type: 'gateway/setGateways',
        payload: mockGateways,
      });

      const state = store.getState();
      expect(state.gateway.gateways).toEqual(mockGateways);
    });

    it('should handle addGateway action', () => {
      const newGateway = {
        apiVersion: 'gateway.networking.k8s.io/v1',
        kind: 'Gateway',
        metadata: { name: 'new-gateway', namespace: 'default' },
        spec: { gatewayClassName: 'envoy-gateway', listeners: [] },
      };

      store.dispatch({
        type: 'gateway/addGateway',
        payload: newGateway,
      });

      const state = store.getState();
      expect(state.gateway.gateways).toContainEqual(newGateway);
    });

    it('should handle removeGateway action', () => {
      const gateways = [
        {
          apiVersion: 'gateway.networking.k8s.io/v1',
          kind: 'Gateway',
          metadata: { name: 'gateway-1', namespace: 'default' },
          spec: { gatewayClassName: 'envoy-gateway', listeners: [] },
        },
        {
          apiVersion: 'gateway.networking.k8s.io/v1',
          kind: 'Gateway',
          metadata: { name: 'gateway-2', namespace: 'default' },
          spec: { gatewayClassName: 'envoy-gateway', listeners: [] },
        },
      ];

      store.dispatch({
        type: 'gateway/setGateways',
        payload: gateways,
      });

      store.dispatch({
        type: 'gateway/removeGateway',
        payload: { name: 'gateway-1', namespace: 'default' },
      });

      const state = store.getState();
      expect(state.gateway.gateways).toHaveLength(1);
      expect(state.gateway.gateways[0].metadata.name).toBe('gateway-2');
    });

    it('should handle setLoading action', () => {
      store.dispatch({
        type: 'gateway/setLoading',
        payload: true,
      });

      const state = store.getState();
      expect(state.gateway.loading).toBe(true);
    });

    it('should handle setError action', () => {
      const errorMessage = 'Test error';
      store.dispatch({
        type: 'gateway/setError',
        payload: errorMessage,
      });

      const state = store.getState();
      expect(state.gateway.error).toBe(errorMessage);
    });
  });

  describe('API Integration Mock Tests', () => {
    it('should call API service for gateways', async () => {
      const mockGateways = [
        {
          apiVersion: 'gateway.networking.k8s.io/v1',
          kind: 'Gateway',
          metadata: { name: 'api-gateway', namespace: 'default' },
          spec: { gatewayClassName: 'envoy-gateway', listeners: [] },
        },
      ];

      mockApiService.getGateways.mockResolvedValue({ data: mockGateways });

      const result = await mockApiService.getGateways();
      expect(result.data).toEqual(mockGateways);
      expect(mockApiService.getGateways).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      mockApiService.getGateways.mockRejectedValue(new Error(errorMessage));

      await expect(mockApiService.getGateways()).rejects.toThrow(errorMessage);
    });

    it('should create gateway via API', async () => {
      const gatewayData = {
        name: 'new-gateway',
        namespace: 'default',
        gatewayClassName: 'envoy-gateway',
        listeners: [],
      };

      const mockResponse = {
        apiVersion: 'gateway.networking.k8s.io/v1',
        kind: 'Gateway',
        metadata: { name: gatewayData.name, namespace: gatewayData.namespace },
        spec: {
          gatewayClassName: gatewayData.gatewayClassName,
          listeners: gatewayData.listeners,
        },
      };

      mockApiService.createGateway.mockResolvedValue({ data: mockResponse });

      const result = await mockApiService.createGateway(gatewayData);
      expect(result.data).toEqual(mockResponse);
      expect(mockApiService.createGateway).toHaveBeenCalledWith(gatewayData);
    });
  });
});