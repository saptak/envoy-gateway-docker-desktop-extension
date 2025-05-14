import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/uiSlice';
import { apiService } from '../services/api';

// Generic hook for API calls
export function useApi<T, P = any>(
  apiFunction: (params?: P) => Promise<T>,
  options: {
    immediate?: boolean;
    params?: P;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    showSuccessNotification?: boolean;
    showErrorNotification?: boolean;
    successMessage?: string;
    errorMessage?: string;
  } = {}
) {
  const {
    immediate = false,
    params,
    onSuccess,
    onError,
    showSuccessNotification = false,
    showErrorNotification = true,
    successMessage = 'Operation completed successfully',
    errorMessage = 'An error occurred',
  } = options;

  const dispatch = useDispatch();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  // Execute the API call
  const execute = useCallback(
    async (executeParams?: P) => {
      try {
        setLoading(true);
        setError(null);

        // Use executeParams if provided, otherwise use params from options
        const result = await apiFunction(executeParams !== undefined ? executeParams : params);
        
        setData(result);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
        
        // Show success notification if enabled
        if (showSuccessNotification) {
          dispatch(
            addNotification({
              id: `api-success-${Date.now()}`,
              type: 'success',
              title: 'Success',
              message: successMessage,
              duration: 3000,
            })
          );
        }
        
        return result;
      } catch (err: any) {
        setError(err);
        
        // Call onError callback if provided
        if (onError) {
          onError(err);
        }
        
        // Show error notification if enabled
        if (showErrorNotification) {
          dispatch(
            addNotification({
              id: `api-error-${Date.now()}`,
              type: 'error',
              title: 'Error',
              message: err.response?.data?.error?.message || errorMessage,
              duration: 5000,
            })
          );
        }
        
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      apiFunction,
      params,
      onSuccess,
      onError,
      showSuccessNotification,
      showErrorNotification,
      successMessage,
      errorMessage,
      dispatch,
    ]
  );

  // Execute immediately if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  // Reset the state
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Predefined hooks for common API calls
export function useSystemStatus(options = {}) {
  return useApi(apiService.getSystemStatus, options);
}

export function useGateways(options = {}) {
  return useApi(apiService.getGateways, options);
}

export function useGateway(namespace: string, name: string, options = {}) {
  return useApi(
    () => apiService.getGateway(namespace, name),
    { ...options, immediate: true }
  );
}

export function useCreateGateway(options = {}) {
  return useApi(
    apiService.createGateway,
    {
      ...options,
      showSuccessNotification: true,
      successMessage: 'Gateway created successfully',
    }
  );
}

export function useUpdateGateway(namespace: string, name: string, options = {}) {
  return useApi(
    (gateway) => apiService.updateGateway(namespace, name, gateway),
    {
      ...options,
      showSuccessNotification: true,
      successMessage: 'Gateway updated successfully',
    }
  );
}

export function useDeleteGateway(options = {}) {
  return useApi(
    ({ namespace, name }) => apiService.deleteGateway(namespace, name),
    {
      ...options,
      showSuccessNotification: true,
      successMessage: 'Gateway deleted successfully',
    }
  );
}

export function useRoutes(options = {}) {
  return useApi(apiService.getHTTPRoutes, options);
}

export function useRoute(namespace: string, name: string, options = {}) {
  return useApi(
    () => apiService.getHTTPRoute(namespace, name),
    { ...options, immediate: true }
  );
}

export function useCreateRoute(options = {}) {
  return useApi(
    apiService.createHTTPRoute,
    {
      ...options,
      showSuccessNotification: true,
      successMessage: 'Route created successfully',
    }
  );
}

export function useUpdateRoute(namespace: string, name: string, options = {}) {
  return useApi(
    (route) => apiService.updateHTTPRoute(namespace, name, route),
    {
      ...options,
      showSuccessNotification: true,
      successMessage: 'Route updated successfully',
    }
  );
}

export function useDeleteRoute(options = {}) {
  return useApi(
    ({ namespace, name }) => apiService.deleteHTTPRoute(namespace, name),
    {
      ...options,
      showSuccessNotification: true,
      successMessage: 'Route deleted successfully',
    }
  );
}

export function useContainers(options = {}) {
  return useApi(apiService.getContainers, options);
}

export function useMetrics(options = {}) {
  return useApi(apiService.getMetrics, options);
}

export function useNamespaces(options = {}) {
  return useApi(apiService.getNamespaces, options);
}

export function useServices(namespace?: string, options = {}) {
  return useApi(
    () => apiService.getServices(namespace),
    { ...options, immediate: true }
  );
}

export function useApplyYAML(options = {}) {
  return useApi(
    apiService.applyYAML,
    {
      ...options,
      showSuccessNotification: true,
      successMessage: 'YAML configuration applied successfully',
    }
  );
}

export default useApi;
