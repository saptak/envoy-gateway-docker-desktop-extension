import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  Gateway, 
  HTTPRoute, 
  DockerContainer, 
  SystemStatus, 
  MonitoringMetrics, 
  ConfigTemplate, 
  LogEntry,
  ApiResponse,
  PaginatedResponse,
  TestCollection,
  TestRun,
  TestCase,
  TestResult
} from '@/types';

interface NamespaceInfo {
  name: string;
  gatewayCount: number;
  routeCount: number;
  totalResources: number;
  error?: string;
}

interface GatewayQueryOptions {
  namespace?: string;
  page?: number;
  pageSize?: number;
}

interface RouteQueryOptions {
  namespace?: string;
  page?: number;
  pageSize?: number;
}

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        
        // Handle common error cases
        if (error.response?.status === 401) {
          // Handle unauthorized access
          window.dispatchEvent(new CustomEvent('auth:required'));
        } else if (error.response?.status >= 500) {
          // Handle server errors
          window.dispatchEvent(new CustomEvent('api:server-error', {
            detail: error.response.data
          }));
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config);
      
      if (!response.data.success && response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data.data as T;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Namespace Management
  async getNamespaces(includeEmpty = false): Promise<NamespaceInfo[]> {
    return this.request<NamespaceInfo[]>({
      method: 'GET',
      url: '/namespaces',
      params: { includeEmpty }
    });
  }

  async getNamespacesWithResources(): Promise<NamespaceInfo[]> {
    return this.request<NamespaceInfo[]>({
      method: 'GET',
      url: '/namespaces/with-resources'
    });
  }

  // System Status
  async getSystemStatus(): Promise<SystemStatus> {
    return this.request<SystemStatus>({
      method: 'GET',
      url: '/status'
    });
  }

  // Docker Container Management
  async getContainers(): Promise<DockerContainer[]> {
    return this.request<DockerContainer[]>({
      method: 'GET',
      url: '/containers'
    });
  }

  async getContainer(id: string): Promise<DockerContainer> {
    return this.request<DockerContainer>({
      method: 'GET',
      url: `/containers/${id}`
    });
  }

  async createContainer(config: any): Promise<DockerContainer> {
    return this.request<DockerContainer>({
      method: 'POST',
      url: '/containers',
      data: config
    });
  }

  async startContainer(id: string): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: `/containers/${id}/start`
    });
  }

  async stopContainer(id: string): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: `/containers/${id}/stop`
    });
  }

  async removeContainer(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/containers/${id}`
    });
  }

  async getContainerLogs(id: string, tail = 100): Promise<string[]> {
    return this.request<string[]>({
      method: 'GET',
      url: `/containers/${id}/logs`,
      params: { tail }
    });
  }

  // Gateway Management
  async getGateways(options: GatewayQueryOptions = {}): Promise<Gateway[]> {
    return this.request<Gateway[]>({
      method: 'GET',
      url: '/gateways',
      params: options
    });
  }

  async getGatewaysAcrossAllNamespaces(options: { page?: number; pageSize?: number } = {}): Promise<{
    gateways: Gateway[];
    total: number;
    namespaceCounts: Record<string, number>;
  }> {
    return this.request<{
      gateways: Gateway[];
      total: number;
      namespaceCounts: Record<string, number>;
    }>({
      method: 'GET',
      url: '/gateways/all-namespaces',
      params: options
    });
  }

  async getGateway(namespace: string, name: string): Promise<Gateway> {
    return this.request<Gateway>({
      method: 'GET',
      url: `/gateways/${namespace}/${name}`
    });
  }

  async createGateway(gateway: Partial<Gateway>): Promise<Gateway> {
    return this.request<Gateway>({
      method: 'POST',
      url: '/gateways',
      data: gateway
    });
  }

  async updateGateway(namespace: string, name: string, gateway: Partial<Gateway>): Promise<Gateway> {
    return this.request<Gateway>({
      method: 'PUT',
      url: `/gateways/${namespace}/${name}`,
      data: gateway
    });
  }

  async deleteGateway(namespace: string, name: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/gateways/${namespace}/${name}`
    });
  }

  // HTTPRoute Management
  async getHTTPRoutes(options: RouteQueryOptions = {}): Promise<HTTPRoute[]> {
    return this.request<HTTPRoute[]>({
      method: 'GET',
      url: '/routes',
      params: options
    });
  }

  async getHTTPRoutesAcrossAllNamespaces(options: { page?: number; pageSize?: number } = {}): Promise<{
    routes: HTTPRoute[];
    total: number;
    namespaceCounts: Record<string, number>;
  }> {
    return this.request<{
      routes: HTTPRoute[];
      total: number;
      namespaceCounts: Record<string, number>;
    }>({
      method: 'GET',
      url: '/routes/all-namespaces',
      params: options
    });
  }

  async getHTTPRoute(namespace: string, name: string): Promise<HTTPRoute> {
    return this.request<HTTPRoute>({
      method: 'GET',
      url: `/routes/${namespace}/${name}`
    });
  }

  async createHTTPRoute(route: Partial<HTTPRoute>): Promise<HTTPRoute> {
    return this.request<HTTPRoute>({
      method: 'POST',
      url: '/routes',
      data: route
    });
  }

  async updateHTTPRoute(namespace: string, name: string, route: Partial<HTTPRoute>): Promise<HTTPRoute> {
    return this.request<HTTPRoute>({
      method: 'PUT',
      url: `/routes/${namespace}/${name}`,
      data: route
    });
  }

  async deleteHTTPRoute(namespace: string, name: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/routes/${namespace}/${name}`
    });
  }

  // Configuration Templates
  async getConfigTemplates(): Promise<ConfigTemplate[]> {
    return this.request<ConfigTemplate[]>({
      method: 'GET',
      url: '/configurations/templates'
    });
  }

  async getConfigTemplate(id: string): Promise<ConfigTemplate> {
    return this.request<ConfigTemplate>({
      method: 'GET',
      url: `/configurations/templates/${id}`
    });
  }

  async validateConfig(config: any): Promise<{ valid: boolean; errors?: string[] }> {
    return this.request<{ valid: boolean; errors?: string[] }>({
      method: 'POST',
      url: '/configurations/validate',
      data: config
    });
  }

  async applyConfig(config: any): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: '/configurations/apply',
      data: config
    });
  }

  // Monitoring and Metrics
  async getMetrics(): Promise<MonitoringMetrics> {
    return this.request<MonitoringMetrics>({
      method: 'GET',
      url: '/monitoring/metrics'
    });
  }

  async getMetricsHistory(timespan: string = '1h'): Promise<MonitoringMetrics[]> {
    return this.request<MonitoringMetrics[]>({
      method: 'GET',
      url: '/monitoring/metrics/history',
      params: { timespan }
    });
  }

  async getLogs(component?: string, level?: string, limit = 100): Promise<LogEntry[]> {
    return this.request<LogEntry[]>({
      method: 'GET',
      url: '/monitoring/logs',
      params: { component, level, limit }
    });
  }

  // Test Collections
  async getTestCollections(): Promise<TestCollection[]> {
    return this.request<TestCollection[]>({
      method: 'GET',
      url: '/tests/collections'
    });
  }

  async getTestCollection(id: string): Promise<TestCollection> {
    return this.request<TestCollection>({
      method: 'GET',
      url: `/tests/collections/${id}`
    });
  }

  async createTestCollection(collection: Partial<TestCollection>): Promise<TestCollection> {
    return this.request<TestCollection>({
      method: 'POST',
      url: '/tests/collections',
      data: collection
    });
  }

  async updateTestCollection(id: string, collection: Partial<TestCollection>): Promise<TestCollection> {
    return this.request<TestCollection>({
      method: 'PUT',
      url: `/tests/collections/${id}`,
      data: collection
    });
  }

  async deleteTestCollection(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/tests/collections/${id}`
    });
  }

  async runTestCollection(id: string): Promise<TestRun> {
    return this.request<TestRun>({
      method: 'POST',
      url: `/tests/collections/${id}/run`
    });
  }

  async getTestRuns(collectionId?: string): Promise<TestRun[]> {
    return this.request<TestRun[]>({
      method: 'GET',
      url: '/tests/runs',
      params: collectionId ? { collectionId } : {}
    });
  }

  async getTestRun(id: string): Promise<TestRun> {
    return this.request<TestRun>({
      method: 'GET',
      url: `/tests/runs/${id}`
    });
  }

  // Individual Test Execution
  async executeTest(test: TestCase): Promise<TestResult> {
    return this.request<TestResult>({
      method: 'POST',
      url: '/tests/execute',
      data: test
    });
  }

  // Health Check
  async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: number }> {
    return this.request<{ status: 'ok' | 'error'; timestamp: number }>({
      method: 'GET',
      url: '/health'
    });
  }

  // Generic YAML/JSON conversion utilities
  async convertYamlToJson(yaml: string): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/utils/yaml-to-json',
      data: { yaml }
    });
  }

  async convertJsonToYaml(json: any): Promise<string> {
    return this.request<string>({
      method: 'POST',
      url: '/utils/json-to-yaml',
      data: { json }
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;