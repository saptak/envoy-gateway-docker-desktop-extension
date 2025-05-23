import { createDockerDesktopClient } from '@docker/extension-api-client';

// Enhanced API response types
interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Error types
export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly requestId: string;
  public readonly timestamp: string;

  constructor(response: ApiErrorResponse) {
    super(response.error.message);
    this.code = response.error.code;
    this.details = response.error.details;
    this.requestId = response.error.requestId;
    this.timestamp = response.error.timestamp;
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryOn?: (error: Error) => boolean;
}

// API client class
export class ApiClient {
  private ddClient: ReturnType<typeof createDockerDesktopClient>;
  private baseURL: string;
  private retryConfig: RetryConfig;
  private isDebugEnabled: boolean;

  constructor(ddClient: ReturnType<typeof createDockerDesktopClient>) {
    this.ddClient = ddClient;
    this.baseURL = 'http://localhost:8080/api';
    this.isDebugEnabled = true; // Enable debug logging
    
    this.debugLog('ApiClient initialized with Docker Desktop client');
    this.debugLog(`Using API endpoint: ${this.baseURL}`);
    
    this.retryConfig = {
      maxRetries: 5, // Increased for better reliability
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryOn: (error) => {
        // Retry on network errors, socket errors, and 5xx responses
        console.log('[API] Checking if error should trigger retry:', error.message);
        return error instanceof NetworkError || 
               (error instanceof ApiError && error.code?.includes('CONNECTION')) ||
               error.message.includes('socket') ||
               error.message.includes('network') ||
               error.message.includes('timeout');
      }
    };
  }
  
  // Debug logging helper
  private debugLog(...args: any[]): void {
    if (this.isDebugEnabled) {
      console.log('[API Debug]', ...args);
    }
  }

  // Core request method with retry logic and improved error handling
  private async request<T>(
    endpoint: string,
    options: any = {},
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    let lastError: Error | null = null;
    let delay = config.initialDelay;

    this.debugLog(`Beginning request to ${endpoint} with retry config:`, config);

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const url = `${this.baseURL}${endpoint}`;
        this.debugLog(`Making request attempt ${attempt + 1}/${config.maxRetries + 1} to: ${url}`);

        // Direct fetch for all requests
        const fetchResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          ...options
        });
        
        if (!fetchResponse.ok) {
          throw new NetworkError(`HTTP error: ${fetchResponse.status} ${fetchResponse.statusText}`);
        }
        
        const response = await fetchResponse.json();
        
        this.debugLog(`Raw response received:`, response);
        
        if (!response) {
          throw new NetworkError('No response from backend service');
        }

        // Check if response is an API error format
        if (response && typeof response === 'object' && 'success' in response) {
          const apiResponse = response as ApiResponse<T>;
          if (!apiResponse.success) {
            throw new ApiError(apiResponse);
          }
          return apiResponse.data;
        }

        // Legacy response format (fallback)
        return response as T;
      } catch (error: any) {
        lastError = error as Error;
        
        console.warn(`API request attempt ${attempt + 1}/${config.maxRetries + 1} failed:`, {
          endpoint,
          error: lastError.message,
          attempt: attempt + 1
        });

        // Log the full error for debugging
        this.debugLog('Full error details:', error);

        // Check if we should retry
        const shouldRetry = attempt < config.maxRetries && config.retryOn?.(lastError);
        this.debugLog(`Should retry? ${shouldRetry}`);
        
        if (shouldRetry) {
          this.debugLog(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
        } else {
          break;
        }
      }
    }

    // If no error occurred (which shouldn't happen since we return in the try block)
    // or if lastError is still null, throw a generic error
    if (!lastError) {
      throw new NetworkError('Request failed without error details');
    }

    throw lastError;
  }

  // POST request with retry and improved error handling
  private async post<T>(
    endpoint: string,
    data: any,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    let lastError: Error | null = null;
    let delay = config.initialDelay;

    this.debugLog(`Beginning POST request to ${endpoint} with data:`, data);

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const url = `${this.baseURL}${endpoint}`;
        this.debugLog(`Making POST request attempt ${attempt + 1}/${config.maxRetries + 1} to: ${url}`);
        
        // Direct fetch for all requests
        const fetchResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!fetchResponse.ok) {
          throw new NetworkError(`HTTP error: ${fetchResponse.status} ${fetchResponse.statusText}`);
        }
        
        const response = await fetchResponse.json();
        
        this.debugLog(`POST raw response received:`, response);
        
        if (!response) {
          throw new NetworkError('No response from backend service for POST request');
        }

        // Check if response is an API error format
        if (response && typeof response === 'object' && 'success' in response) {
          const apiResponse = response as ApiResponse<T>;
          if (!apiResponse.success) {
            throw new ApiError(apiResponse);
          }
          return apiResponse.data;
        }

        // Legacy response format (fallback)
        return response as T;
      } catch (error: any) {
        lastError = error as Error;
        
        console.warn(`API POST attempt ${attempt + 1}/${config.maxRetries + 1} failed:`, {
          endpoint,
          error: lastError.message,
          attempt: attempt + 1
        });

        // Log the full error for debugging
        this.debugLog('POST full error details:', error);

        // Check if we should retry
        const shouldRetry = attempt < config.maxRetries && config.retryOn?.(lastError);
        this.debugLog(`Should retry POST? ${shouldRetry}`);
        
        if (shouldRetry) {
          this.debugLog(`Retrying POST in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
        } else {
          break;
        }
      }
    }

    // If no error occurred or if lastError is still null, throw a generic error
    if (!lastError) {
      throw new NetworkError('POST request failed without error details');
    }

    throw lastError;
  }

  // PUT request with retry
  private async put<T>(
    endpoint: string,
    data: any,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    return this.post(endpoint, { ...data, _method: 'PUT' }, customRetryConfig);
  }

  // DELETE request with retry
  private async delete<T>(
    endpoint: string,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    return this.post(endpoint, { _method: 'DELETE' }, customRetryConfig);
  }

  // Health check
  async getHealth(): Promise<any> {
    return this.request('/health');
  }

  // Namespaces
  async getNamespaces(): Promise<{ namespaces: any[] }> {
    return this.request('/namespaces');
  }

  // Gateways
  async getGateways(namespace?: string): Promise<{ gateways: any[]; total: number }> {
    const endpoint = namespace ? `/gateways?namespace=${namespace}` : '/gateways';
    return this.request(endpoint);
  }

  async createGateway(gateway: any): Promise<{ gateway: any }> {
    return this.post('/gateways', gateway, { maxRetries: 1 }); // Don't retry creation
  }

  async updateGateway(name: string, namespace: string, gateway: any): Promise<{ gateway: any }> {
    return this.put(`/gateways/${namespace}/${name}`, gateway, { maxRetries: 1 });
  }

  async deleteGateway(name: string, namespace: string): Promise<{ success: boolean }> {
    return this.delete(`/gateways/${namespace}/${name}`, { maxRetries: 1 });
  }

  async getGateway(name: string, namespace: string): Promise<{ gateway: any }> {
    return this.request(`/gateways/${namespace}/${name}`);
  }

  // Routes
  async getRoutes(namespace?: string): Promise<{ routes: any[]; total: number }> {
    const endpoint = namespace ? `/routes?namespace=${namespace}` : '/routes';
    return this.request(endpoint);
  }

  async createRoute(route: any): Promise<{ route: any }> {
    return this.post('/routes', route, { maxRetries: 1 }); // Don't retry creation
  }

  async updateRoute(name: string, namespace: string, route: any): Promise<{ route: any }> {
    return this.put(`/routes/${namespace}/${name}`, route, { maxRetries: 1 });
  }

  async deleteRoute(name: string, namespace: string): Promise<{ success: boolean }> {
    return this.delete(`/routes/${namespace}/${name}`, { maxRetries: 1 });
  }

  async getRoute(name: string, namespace: string): Promise<{ route: any }> {
    return this.request(`/routes/${namespace}/${name}`);
  }

  // Quick setup
  async getQuickSetupStatus(): Promise<any> {
    return this.request('/quick-setup/status');
  }

  async installQuickSetup(): Promise<any> {
    return this.post('/quick-setup/install', {}, { maxRetries: 0 }); // Don't retry installation
  }
}

// Hook for using the API client
export const useApiClient = (ddClient: ReturnType<typeof createDockerDesktopClient>) => {
  return new ApiClient(ddClient);
};
