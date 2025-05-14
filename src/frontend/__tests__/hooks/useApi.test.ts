import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import useApi from '../../src/hooks/useApi';
import uiReducer from '../../src/store/slices/uiSlice';
import systemReducer from '../../src/store/slices/systemSlice';
import gatewayReducer from '../../src/store/slices/gatewaySlice';
import routeReducer from '../../src/store/slices/routeSlice';
import containerReducer from '../../src/store/slices/containerSlice';
import monitoringReducer from '../../src/store/slices/monitoringSlice';
import testingReducer from '../../src/store/slices/testingSlice';

// Mock API service
jest.mock('../../src/services/api', () => ({
  apiService: {
    getSystemStatus: jest.fn(),
    getGateways: jest.fn(),
    getHTTPRoutes: jest.fn(),
    getContainers: jest.fn(),
    getMetrics: jest.fn(),
    getLogs: jest.fn(),
    getTestCollections: jest.fn(),
    getTestRuns: jest.fn(),
    createGateway: jest.fn(),
    updateGateway: jest.fn(),
    deleteGateway: jest.fn(),
    createHTTPRoute: jest.fn(),
    updateHTTPRoute: jest.fn(),
    deleteHTTPRoute: jest.fn(),
    createContainer: jest.fn(),
    startContainer: jest.fn(),
    stopContainer: jest.fn(),
    removeContainer: jest.fn(),
    getContainerLogs: jest.fn(),
    fetchMetrics: jest.fn(),
    fetchMetricsHistory: jest.fn(),
    fetchLogs: jest.fn(),
    fetchTestCollections: jest.fn(),
    createTestCollection: jest.fn(),
    runTestCollection: jest.fn(),
    executeTest: jest.fn(),
    healthCheck: jest.fn(),
  },
}));

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      ui: uiReducer,
      system: systemReducer,
      gateways: gatewayReducer,
      routes: routeReducer,
      containers: containerReducer,
      monitoring: monitoringReducer,
      testing: testingReducer,
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({
  children,
  store = createTestStore()
}) => {
  return React.createElement(Provider, { store }, children);
};

describe('useApi hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSystemStatus', () => {
    test('should fetch system status on mount', async () => {
      const { apiService } = require('../../src/services/api');
      const mockStatus = {
        docker: { connected: true },
        kubernetes: { connected: true },
        envoyGateway: { status: 'running' },
      };

      apiService.getSystemStatus.mockResolvedValue(mockStatus);
      apiService.healthCheck.mockResolvedValue({ status: 'ok', timestamp: Date.now() });

      const { result } = renderHook(() => useApi.useSystemStatus(), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(true);

      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(apiService.getSystemStatus).toHaveBeenCalled();
      expect(result.current.status).toEqual(mockStatus);
    });

    test('should handle errors gracefully', async () => {
      const { apiService } = require('../../src/services/api');
      apiService.getSystemStatus.mockRejectedValue(new Error('Connection failed'));

      const { result } = renderHook(() => useApi.useSystemStatus(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useGateways', () => {
    test('should fetch gateways on mount', async () => {
      const { apiService } = require('../../src/services/api');
      const mockGateways = [
        { id: 'gw1', name: 'gateway1', namespace: 'default' },
        { id: 'gw2', name: 'gateway2', namespace: 'production' },
      ];

      apiService.getGateways.mockResolvedValue(mockGateways);

      const { result } = renderHook(() => useApi.useGateways(), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(apiService.getGateways).toHaveBeenCalled();
      expect(result.current.gateways).toEqual(mockGateways);
    });

    test('should create gateway successfully', async () => {
      const { apiService } = require('../../src/services/api');
      const newGateway = { name: 'test-gateway', namespace: 'default' };
      const createdGateway = { id: 'gw3', ...newGateway };

      apiService.createGateway.mockResolvedValue(createdGateway);
      apiService.getGateways.mockResolvedValue([]);

      const { result } = renderHook(() => useApi.useGateways(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.create(newGateway);
      });

      expect(apiService.createGateway).toHaveBeenCalledWith(newGateway);
    });

    test('should handle create errors', async () => {
      const { apiService } = require('../../src/services/api');
      const newGateway = { name: 'test-gateway', namespace: 'default' };

      apiService.createGateway.mockRejectedValue(new Error('Failed to create'));
      apiService.getGateways.mockResolvedValue([]);

      const { result } = renderHook(() => useApi.useGateways(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await expect(result.current.create(newGateway)).rejects.toThrow('Failed to create');
      });
    });
  });

  describe('useContainers', () => {
    test('should manage container lifecycle', async () => {
      const { apiService } = require('../../src/services/api');
      const mockContainers = [
        { id: 'c1', name: 'container1', state: 'stopped' },
        { id: 'c2', name: 'container2', state: 'running' },
      ];

      apiService.getContainers.mockResolvedValue(mockContainers);
      apiService.startContainer.mockResolvedValue(undefined);
      apiService.getContainer.mockResolvedValue(mockContainers[0]);

      const { result } = renderHook(() => useApi.useContainers(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.containers).toEqual(mockContainers);

      // Test starting a container
      await act(async () => {
        await result.current.start('c1');
      });

      expect(apiService.startContainer).toHaveBeenCalledWith('c1');
    });

    test('should fetch container logs', async () => {
      const { apiService } = require('../../src/services/api');
      const mockLogs = ['log line 1', 'log line 2'];

      apiService.getContainers.mockResolvedValue([]);
      apiService.getContainerLogs.mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useApi.useContainers(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.getLogs('c1', 100);
      });

      expect(apiService.getContainerLogs).toHaveBeenCalledWith('c1', 100);
    });
  });

  describe('useMonitoring', () => {
    test('should fetch metrics and logs', async () => {
      const { apiService } = require('../../src/services/api');
      const mockMetrics = {
        timestamp: Date.now(),
        gateways: { total: 2, healthy: 2, unhealthy: 0 },
        routes: { total: 5, attached: 5, detached: 0 },
        traffic: { requestRate: 100, errorRate: 0.1 },
      };
      const mockLogs = [
        { id: '1', timestamp: '2025-01-01T00:00:00Z', level: 'info', message: 'Test log' },
      ];

      apiService.getMetrics.mockResolvedValue(mockMetrics);
      apiService.getLogs.mockResolvedValue(mockLogs);

      const store = createTestStore({
        monitoring: {
          currentMetrics: null,
          metricsHistory: [],
          logs: [],
          loading: false,
          error: null,
          filters: { component: '', level: '', timeRange: '1h' },
          metricsConfig: { refreshInterval: 5000, historyDuration: '1h', autoRefresh: true },
          logsConfig: { maxLines: 1000, autoScroll: true, realTime: true },
        },
      });

      const WrappedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        return React.createElement(TestWrapper, { store }, children);
      };

      const { result } = renderHook(() => useApi.useMonitoring(), {
        wrapper: WrappedProvider,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(apiService.getMetrics).toHaveBeenCalled();
      expect(apiService.getLogs).toHaveBeenCalled();
    });

    test('should respect auto-refresh setting', () => {
      const { apiService } = require('../../src/services/api');
      apiService.getMetrics.mockResolvedValue({});
      apiService.getLogs.mockResolvedValue([]);

      const store = createTestStore({
        monitoring: {
          currentMetrics: null,
          metricsHistory: [],
          logs: [],
          loading: false,
          error: null,
          filters: { component: '', level: '', timeRange: '1h' },
          metricsConfig: { refreshInterval: 1000, historyDuration: '1h', autoRefresh: true },
          logsConfig: { maxLines: 1000, autoScroll: true, realTime: true },
        },
      });

      const WrappedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        return React.createElement(TestWrapper, { store }, children);
      };

      const { unmount } = renderHook(() => useApi.useMonitoring(), {
        wrapper: WrappedProvider,
      });

      // Should set up interval when autoRefresh is true
      expect(apiService.getMetrics).toHaveBeenCalled();

      // Cleanup should clear interval
      unmount();
    });
  });

  describe('useTesting', () => {
    test('should manage test collections', async () => {
      const { apiService } = require('../../src/services/api');
      const mockCollections = [
        { id: '1', name: 'Test Collection 1', tests: [] },
        { id: '2', name: 'Test Collection 2', tests: [] },
      ];
      const mockRuns = [
        { id: 'run1', collectionId: '1', status: 'completed', summary: { total: 5, passed: 5, failed: 0 } },
      ];

      apiService.getTestCollections.mockResolvedValue(mockCollections);
      apiService.getTestRuns.mockResolvedValue(mockRuns);

      const { result } = renderHook(() => useApi.useTesting(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(apiService.getTestCollections).toHaveBeenCalled();
      expect(apiService.getTestRuns).toHaveBeenCalled();
      expect(result.current.collections).toEqual(mockCollections);
      expect(result.current.testRuns).toEqual(mockRuns);
    });

    test('should create and run test collections', async () => {
      const { apiService } = require('../../src/services/api');
      const newCollection = { name: 'New Collection', description: 'Test description', tests: [] };
      const createdCollection = { id: '3', ...newCollection };
      const testRun = { id: 'run2', collectionId: '3', status: 'running' };

      apiService.getTestCollections.mockResolvedValue([]);
      apiService.getTestRuns.mockResolvedValue([]);
      apiService.createTestCollection.mockResolvedValue(createdCollection);
      apiService.runTestCollection.mockResolvedValue(testRun);

      const { result } = renderHook(() => useApi.useTesting(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.createCollection(newCollection);
      });

      expect(apiService.createTestCollection).toHaveBeenCalledWith(newCollection);

      await act(async () => {
        await result.current.runCollection('3');
      });

      expect(apiService.runTestCollection).toHaveBeenCalledWith('3');
    });
  });

  describe('useAsyncOperation', () => {
    test('should manage loading and error states', async () => {
      const { result } = renderHook(() => useApi.useAsyncOperation());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);

      // Test successful operation
      const successfulOperation = () => Promise.resolve('success');

      await act(async () => {
        const resultValue = await result.current.execute(successfulOperation);
        expect(resultValue).toBe('success');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);

      // Test failed operation
      const failedOperation = () => Promise.reject(new Error('Operation failed'));

      await act(async () => {
        await expect(result.current.execute(failedOperation)).rejects.toThrow('Operation failed');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Operation failed');

      // Test reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should call success and error callbacks', async () => {
      const { result } = renderHook(() => useApi.useAsyncOperation());

      const onSuccess = jest.fn();
      const onError = jest.fn();

      // Test successful operation with callback
      const successfulOperation = () => Promise.resolve('success');

      await act(async () => {
        await result.current.execute(successfulOperation, { onSuccess });
      });

      expect(onSuccess).toHaveBeenCalledWith('success');

      // Test failed operation with callback
      const failedOperation = () => Promise.reject(new Error('Failed'));

      await act(async () => {
        await expect(result.current.execute(failedOperation, { onError })).rejects.toThrow('Failed');
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
