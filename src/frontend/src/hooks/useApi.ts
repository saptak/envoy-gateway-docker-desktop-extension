import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { 
  fetchSystemStatus,
  checkHealth 
} from '@/store/slices/systemSlice';
import {
  fetchGateways,
  fetchGateway,
  createGateway,
  updateGateway,
  deleteGateway
} from '@/store/slices/gatewaySlice';
import {
  fetchRoutes,
  fetchRoute,
  createRoute,
  updateRoute,
  deleteRoute
} from '@/store/slices/routeSlice';
import {
  fetchContainers,
  fetchContainer,
  createContainer,
  startContainer,
  stopContainer,
  removeContainer,
  fetchContainerLogs
} from '@/store/slices/containerSlice';
import {
  fetchMetrics,
  fetchMetricsHistory,
  fetchLogs
} from '@/store/slices/monitoringSlice';
import {
  fetchTestCollections,
  fetchTestCollection,
  createTestCollection,
  updateTestCollection,
  deleteTestCollection,
  runTestCollection,
  fetchTestRuns,
  fetchTestRun,
  executeTest
} from '@/store/slices/testingSlice';
import { addNotification } from '@/store/slices/uiSlice';
import type { Gateway, HTTPRoute, DockerContainer, TestCollection, TestCase } from '@/types';

// System hooks
export const useSystemStatus = () => {
  const dispatch = useAppDispatch();
  const { status, loading, error, connected } = useAppSelector(state => state.system);

  const refresh = useCallback(() => {
    dispatch(fetchSystemStatus());
  }, [dispatch]);

  const healthCheck = useCallback(() => {
    dispatch(checkHealth());
  }, [dispatch]);

  useEffect(() => {
    // Initial fetch
    refresh();

    // Set up periodic health checks
    const interval = setInterval(healthCheck, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [refresh, healthCheck]);

  return {
    status,
    loading,
    error,
    connected,
    refresh,
    healthCheck
  };
};

// Gateway hooks
export const useGateways = () => {
  const dispatch = useAppDispatch();
  const { gateways, loading, error, filters, sortBy, sortOrder } = useAppSelector(state => state.gateways);
  const { selectedNamespace } = useAppSelector(state => state.namespace);

  const refresh = useCallback(() => {
    // Use the selected namespace from the global state
    dispatch(fetchGateways({
      namespace: selectedNamespace,
      showAllNamespaces: !selectedNamespace
    }));
  }, [dispatch, selectedNamespace]);

  const create = useCallback(async (gateway: Partial<Gateway>) => {
    try {
      await dispatch(createGateway(gateway)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Gateway Created',
        message: `Gateway ${gateway.name} created successfully`,
        duration: 3000
      }));
      // Refresh after creating
      refresh();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Create Gateway',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch, refresh]);

  const update = useCallback(async (namespace: string, name: string, gateway: Partial<Gateway>) => {
    try {
      await dispatch(updateGateway({ namespace, name, gateway })).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Gateway Updated',
        message: `Gateway ${name} updated successfully`,
        duration: 3000
      }));
      // Refresh after updating
      refresh();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Update Gateway',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch, refresh]);

  const remove = useCallback(async (namespace: string, name: string) => {
    try {
      await dispatch(deleteGateway({ namespace, name })).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Gateway Deleted',
        message: `Gateway ${name} deleted successfully`,
        duration: 3000
      }));
      // Refresh after deleting
      refresh();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Delete Gateway',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch, refresh]);

  // Refresh when selected namespace changes
  useEffect(() => {
    refresh();
  }, [refresh, selectedNamespace]);

  // Filter and sort gateways
  const filteredGateways = gateways.filter(gateway => {
    if (filters.namespace && gateway.namespace !== filters.namespace) return false;
    if (filters.status && !gateway.status.conditions.some(c => c.type === filters.status)) return false;
    if (filters.search && !gateway.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    let aValue = a[sortBy as keyof Gateway] as string;
    let bValue = b[sortBy as keyof Gateway] as string;
    
    if (sortBy === 'created') {
      aValue = a.createdAt;
      bValue = b.createdAt;
    }
    
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return {
    gateways: filteredGateways,
    allGateways: gateways,
    loading,
    error,
    refresh,
    create,
    update,
    remove
  };
};

export const useGateway = (namespace: string, name: string) => {
  const dispatch = useAppDispatch();
  const { selectedGateway, loading, error } = useAppSelector(state => state.gateways);

  const fetch = useCallback(() => {
    if (namespace && name) {
      dispatch(fetchGateway({ namespace, name }));
    }
  }, [dispatch, namespace, name]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    gateway: selectedGateway,
    loading,
    error,
    refresh: fetch
  };
};

// Route hooks
export const useRoutes = () => {
  const dispatch = useAppDispatch();
  const { routes, loading, error, filters, sortBy, sortOrder } = useAppSelector(state => state.routes);
  const { selectedNamespace } = useAppSelector(state => state.namespace);

  const refresh = useCallback(() => {
    // Use the selected namespace from the global state
    dispatch(fetchRoutes({
      namespace: selectedNamespace,
      showAllNamespaces: !selectedNamespace
    }));
  }, [dispatch, selectedNamespace]);

  const create = useCallback(async (route: Partial<HTTPRoute>) => {
    try {
      await dispatch(createRoute(route)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Route Created',
        message: `Route ${route.name} created successfully`,
        duration: 3000
      }));
      // Refresh after creating
      refresh();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Create Route',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch, refresh]);

  const update = useCallback(async (namespace: string, name: string, route: Partial<HTTPRoute>) => {
    try {
      await dispatch(updateRoute({ namespace, name, route })).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Route Updated',
        message: `Route ${name} updated successfully`,
        duration: 3000
      }));
      // Refresh after updating
      refresh();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Update Route',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch, refresh]);

  const remove = useCallback(async (namespace: string, name: string) => {
    try {
      await dispatch(deleteRoute({ namespace, name })).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Route Deleted',
        message: `Route ${name} deleted successfully`,
        duration: 3000
      }));
      // Refresh after deleting
      refresh();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Delete Route',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch, refresh]);

  // Refresh when selected namespace changes
  useEffect(() => {
    refresh();
  }, [refresh, selectedNamespace]);

  // Filter and sort routes
  const filteredRoutes = routes.filter(route => {
    if (filters.namespace && route.namespace !== filters.namespace) return false;
    if (filters.gateway && !route.parentRefs.some(ref => ref.name === filters.gateway)) return false;
    if (filters.search && !route.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    let aValue = a[sortBy as keyof HTTPRoute] as string;
    let bValue = b[sortBy as keyof HTTPRoute] as string;
    
    if (sortBy === 'created') {
      aValue = a.createdAt;
      bValue = b.createdAt;
    } else if (sortBy === 'gateway') {
      aValue = a.parentRefs[0]?.name || '';
      bValue = b.parentRefs[0]?.name || '';
    }
    
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return {
    routes: filteredRoutes,
    allRoutes: routes,
    loading,
    error,
    refresh,
    create,
    update,
    remove
  };
};

// Container hooks
export const useContainers = () => {
  const dispatch = useAppDispatch();
  const { containers, loading, error, filters, sortBy, sortOrder } = useAppSelector(state => state.containers);

  const refresh = useCallback(() => {
    dispatch(fetchContainers());
  }, [dispatch]);

  const create = useCallback(async (config: any) => {
    try {
      await dispatch(createContainer(config)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Container Created',
        message: `Container created successfully`,
        duration: 3000
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Create Container',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch]);

  const start = useCallback(async (id: string) => {
    try {
      await dispatch(startContainer(id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Container Started',
        message: `Container started successfully`,
        duration: 3000
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Start Container',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch]);

  const stop = useCallback(async (id: string) => {
    try {
      await dispatch(stopContainer(id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Container Stopped',
        message: `Container stopped successfully`,
        duration: 3000
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Stop Container',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch]);

  const remove = useCallback(async (id: string) => {
    try {
      await dispatch(removeContainer(id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Container Removed',
        message: `Container removed successfully`,
        duration: 3000
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Remove Container',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch]);

  const getLogs = useCallback(async (id: string, tail?: number) => {
    try {
      await dispatch(fetchContainerLogs({ id, tail })).unwrap();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Fetch Logs',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Filter and sort containers
  const filteredContainers = containers.filter(container => {
    if (filters.state && container.state !== filters.state) return false;
    if (filters.image && !container.image.includes(filters.image)) return false;
    if (filters.search && !container.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    let aValue = a[sortBy as keyof DockerContainer] as string | number;
    let bValue = b[sortBy as keyof DockerContainer] as string | number;
    
    if (sortBy === 'created') {
      aValue = a.created;
      bValue = b.created;
    }
    
    const comparison = String(aValue).localeCompare(String(bValue));
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return {
    containers: filteredContainers,
    allContainers: containers,
    loading,
    error,
    refresh,
    create,
    start,
    stop,
    remove,
    getLogs
  };
};

// Monitoring hooks
export const useMonitoring = () => {
  const dispatch = useAppDispatch();
  const { 
    currentMetrics, 
    metricsHistory, 
    logs, 
    loading, 
    error, 
    metricsConfig 
  } = useAppSelector(state => state.monitoring);

  const refreshMetrics = useCallback(() => {
    dispatch(fetchMetrics());
  }, [dispatch]);

  const refreshLogs = useCallback((component?: string, level?: string, limit?: number) => {
    dispatch(fetchLogs({ component, level, limit }));
  }, [dispatch]);

  const getMetricsHistory = useCallback((timespan: string) => {
    dispatch(fetchMetricsHistory(timespan));
  }, [dispatch]);

  useEffect(() => {
    // Initial fetch
    refreshMetrics();
    refreshLogs();

    // Set up periodic refresh if auto-refresh is enabled
    if (metricsConfig.autoRefresh) {
      const interval = setInterval(refreshMetrics, metricsConfig.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshMetrics, refreshLogs, metricsConfig.autoRefresh, metricsConfig.refreshInterval]);

  return {
    currentMetrics,
    metricsHistory,
    logs,
    loading,
    error,
    refreshMetrics,
    refreshLogs,
    getMetricsHistory
  };
};

// Testing hooks
export const useTesting = () => {
  const dispatch = useAppDispatch();
  const { 
    collections, 
    testRuns, 
    loading, 
    error, 
    isRunning,
    runProgress 
  } = useAppSelector(state => state.testing);

  const refreshCollections = useCallback(() => {
    dispatch(fetchTestCollections());
  }, [dispatch]);

  const refreshRuns = useCallback((collectionId?: string) => {
    dispatch(fetchTestRuns(collectionId));
  }, [dispatch]);

  const createCollection = useCallback(async (collection: Partial<TestCollection>) => {
    try {
      await dispatch(createTestCollection(collection)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Test Collection Created',
        message: `Collection ${collection.name} created successfully`,
        duration: 3000
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Create Collection',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch]);

  const runCollection = useCallback(async (id: string) => {
    try {
      await dispatch(runTestCollection(id)).unwrap();
      dispatch(addNotification({
        type: 'info',
        title: 'Test Run Started',
        message: `Test collection execution started`,
        duration: 3000
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Run Tests',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch]);

  const executeIndividualTest = useCallback(async (test: TestCase) => {
    try {
      await dispatch(executeTest(test)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Test Executed',
        message: `Test ${test.name} executed successfully`,
        duration: 3000
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Test Failed',
        message: error,
        duration: 5000
      }));
      throw error;
    }
  }, [dispatch]);

  useEffect(() => {
    refreshCollections();
    refreshRuns();
  }, [refreshCollections, refreshRuns]);

  return {
    collections,
    testRuns,
    loading,
    error,
    isRunning,
    runProgress,
    refreshCollections,
    refreshRuns,
    createCollection,
    runCollection,
    executeIndividualTest
  };
};

// Generic async operation hook
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      showNotifications?: boolean;
    }
  ): Promise<T | undefined> => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      if (options?.onError) {
        options.onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset
  };
};
