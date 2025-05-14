import { configureStore } from '@reduxjs/toolkit';
import uiReducer from '../../store/slices/uiSlice';
import systemReducer from '../../store/slices/systemSlice';
import gatewayReducer from '../../store/slices/gatewaySlice';
import routeReducer from '../../store/slices/routeSlice';
import containerReducer from '../../store/slices/containerSlice';
import monitoringReducer from '../../store/slices/monitoringSlice';
import testingReducer from '../../store/slices/testingSlice';

// Mock API service
jest.mock('../../services/api', () => ({
  apiService: {
    getSystemStatus: jest.fn(),
    getGateways: jest.fn(),
    getHTTPRoutes: jest.fn(),
    getContainers: jest.fn(),
    getMetrics: jest.fn(),
    createGateway: jest.fn(),
    updateGateway: jest.fn(),
    deleteGateway: jest.fn(),
    createHTTPRoute: jest.fn(),
    startContainer: jest.fn(),
    stopContainer: jest.fn(),
  },
}));

describe('Redux Store Integration', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    store = configureStore({
      reducer: {
        ui: uiReducer,
        system: systemReducer,
        gateways: gatewayReducer,
        routes: routeReducer,
        containers: containerReducer,
        monitoring: monitoringReducer,
        testing: testingReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });
  });

  describe('UI Slice', () => {
    test('should handle theme changes', () => {
      const { setTheme } = require('../../store/slices/uiSlice');
      
      store.dispatch(setTheme('dark'));
      expect(store.getState().ui.theme).toBe('dark');
      
      store.dispatch(setTheme('light'));
      expect(store.getState().ui.theme).toBe('light');
    });

    test('should handle sidebar toggle', () => {
      const { toggleSidebar } = require('../../store/slices/uiSlice');
      
      const initialState = store.getState().ui.sidebarCollapsed;
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarCollapsed).toBe(!initialState);
    });

    test('should handle notifications', () => {
      const { addNotification, removeNotification } = require('../../store/slices/uiSlice');
      
      const notification = {
        type: 'success',
        title: 'Test',
        message: 'Test message',
      };
      
      store.dispatch(addNotification(notification));
      const state = store.getState().ui;
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].title).toBe('Test');
      
      const notificationId = state.notifications[0].id;
      store.dispatch(removeNotification(notificationId));
      expect(store.getState().ui.notifications).toHaveLength(0);
    });
  });

  describe('System Slice', () => {
    test('should handle system status updates', async () => {
      const { fetchSystemStatus } = require('../../store/slices/systemSlice');
      const { apiService } = require('../../services/api');
      
      const mockStatus = {
        docker: { connected: true },
        kubernetes: { connected: true },
        envoyGateway: { status: 'running' },
      };
      
      apiService.getSystemStatus.mockResolvedValue(mockStatus);
      
      await store.dispatch(fetchSystemStatus());
      
      const state = store.getState().system;
      expect(state.status).toEqual(mockStatus);
      expect(state.connected).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle system status errors', async () => {
      const { fetchSystemStatus } = require('../../store/slices/systemSlice');
      const { apiService } = require('../../services/api');
      
      apiService.getSystemStatus.mockRejectedValue(new Error('Connection failed'));
      
      await store.dispatch(fetchSystemStatus());
      
      const state = store.getState().system;
      expect(state.status).toBeNull();
      expect(state.connected).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Connection failed');
    });
  });

  describe('Gateway Slice', () => {
    test('should handle gateway fetching', async () => {
      const { fetchGateways } = require('../../store/slices/gatewaySlice');
      const { apiService } = require('../../services/api');
      
      const mockGateways = [
        { id: 'gw1', name: 'gateway1', namespace: 'default' },
        { id: 'gw2', name: 'gateway2', namespace: 'production' },
      ];
      
      apiService.getGateways.mockResolvedValue(mockGateways);
      
      await store.dispatch(fetchGateways());
      
      const state = store.getState().gateways;
      expect(state.gateways).toEqual(mockGateways);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle gateway creation', async () => {
      const { createGateway } = require('../../store/slices/gatewaySlice');
      const { apiService } = require('../../services/api');
      
      const newGateway = { name: 'new-gateway', namespace: 'default' };
      const createdGateway = { id: 'gw3', ...newGateway };
      
      apiService.createGateway.mockResolvedValue(createdGateway);
      
      await store.dispatch(createGateway(newGateway));
      
      const state = store.getState().gateways;
      expect(state.gateways).toContainEqual(createdGateway);
      expect(state.selectedGateway).toEqual(createdGateway);
    });

    test('should handle gateway filtering', () => {
      const { setFilters } = require('../../store/slices/gatewaySlice');
      
      store.dispatch(setFilters({ namespace: 'production', search: 'test' }));
      
      const state = store.getState().gateways;
      expect(state.filters.namespace).toBe('production');
      expect(state.filters.search).toBe('test');
    });
  });

  describe('Container Slice', () => {
    test('should handle container operations', async () => {
      const { fetchContainers, startContainer } = require('../../store/slices/containerSlice');
      const { apiService } = require('../../services/api');
      
      const mockContainers = [
        { id: 'c1', name: 'container1', state: 'stopped' },
        { id: 'c2', name: 'container2', state: 'running' },
      ];
      
      apiService.getContainers.mockResolvedValue(mockContainers);
      apiService.startContainer.mockResolvedValue(undefined);
      
      await store.dispatch(fetchContainers());
      expect(store.getState().containers.containers).toEqual(mockContainers);
      
      await store.dispatch(startContainer('c1'));
      expect(apiService.startContainer).toHaveBeenCalledWith('c1');
    });
  });

  describe('Monitoring Slice', () => {
    test('should handle metrics updates', async () => {
      const { fetchMetrics, updateMetrics } = require('../../store/slices/monitoringSlice');
      const { apiService } = require('../../services/api');
      
      const mockMetrics = {
        timestamp: Date.now(),
        gateways: { total: 2, healthy: 2, unhealthy: 0 },
        routes: { total: 5, attached: 5, detached: 0 },
        traffic: { requestRate: 100, errorRate: 0.1 },
      };
      
      apiService.getMetrics.mockResolvedValue(mockMetrics);
      
      await store.dispatch(fetchMetrics());
      expect(store.getState().monitoring.currentMetrics).toEqual(mockMetrics);
      
      // Test direct update
      const newMetrics = { ...mockMetrics, timestamp: Date.now() + 1000 };
      store.dispatch(updateMetrics(newMetrics));
      expect(store.getState().monitoring.currentMetrics).toEqual(newMetrics);
      expect(store.getState().monitoring.metricsHistory).toContain(newMetrics);
    });

    test('should handle log entries', () => {
      const { addLogEntry } = require('../../store/slices/monitoringSlice');
      
      const logEntry = {
        id: 'log1',
        timestamp: new Date().toISOString(),
        level: 'info',
        component: 'gateway',
        message: 'Test log message',
      };
      
      store.dispatch(addLogEntry(logEntry));
      
      const state = store.getState().monitoring;
      expect(state.logs).toContain(logEntry);
    });
  });

  describe('Cross-Slice Interactions', () => {
    test('should handle connected state across slices', async () => {
      const { fetchSystemStatus } = require('../../store/slices/systemSlice');
      const { setConnected } = require('../../store/slices/systemSlice');
      const { apiService } = require('../../services/api');
      
      // Test system status affects UI state
      apiService.getSystemStatus.mockResolvedValue({
        docker: { connected: true },
        kubernetes: { connected: true },
        envoyGateway: { status: 'running' },
      });
      
      await store.dispatch(fetchSystemStatus());
      expect(store.getState().system.connected).toBe(true);
      
      // Test manual connection state changes
      store.dispatch(setConnected(false));
      expect(store.getState().system.connected).toBe(false);
    });

    test('should handle error states across slices', async () => {
      const { fetchGateways } = require('../../store/slices/gatewaySlice');
      const { fetchSystemStatus } = require('../../store/slices/systemSlice');
      const { apiService } = require('../../services/api');
      
      // Test error propagation
      apiService.getGateways.mockRejectedValue(new Error('Gateway error'));
      apiService.getSystemStatus.mockRejectedValue(new Error('System error'));
      
      await store.dispatch(fetchGateways());
      await store.dispatch(fetchSystemStatus());
      
      expect(store.getState().gateways.error).toBe('Gateway error');
      expect(store.getState().system.error).toBe('System error');
    });
  });
});
