import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Base API configuration
const API_BASE_URL = '/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Add request interceptor for auth tokens, etc.
apiClient.interceptors.request.use(
  (config) => {
    // Add any request headers here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with a status code outside of 2xx
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('API No Response:', error.request);
    } else {
      // Something else happened while setting up the request
      console.error('API Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API service with typed methods
export const apiService = {
  // System endpoints
  async getSystemStatus(): Promise<any> {
    const response = await apiClient.get('/health');
    return response.data.data;
  },

  async healthCheck(): Promise<any> {
    const response = await apiClient.get('/health/liveness');
    return response.data;
  },

  // Gateway endpoints
  async getGateways(namespace?: string): Promise<any[]> {
    const params = namespace ? { namespace } : {};
    const response = await apiClient.get('/gateways', { params });
    return response.data.data.gateways;
  },

  async getGateway(namespace: string, name: string): Promise<any> {
    const response = await apiClient.get(`/gateways/${namespace}/${name}`);
    return response.data.data;
  },

  async createGateway(gateway: any): Promise<any> {
    const response = await apiClient.post('/gateways', gateway);
    return response.data.data;
  },

  async updateGateway(namespace: string, name: string, gateway: any): Promise<any> {
    const response = await apiClient.put(`/gateways/${namespace}/${name}`, gateway);
    return response.data.data;
  },

  async deleteGateway(namespace: string, name: string): Promise<any> {
    const response = await apiClient.delete(`/gateways/${namespace}/${name}`);
    return response.data.data;
  },

  // HTTP Route endpoints
  async getHTTPRoutes(namespace?: string, gatewayName?: string): Promise<any[]> {
    const params: any = {};
    if (namespace) params.namespace = namespace;
    if (gatewayName) params.gateway = gatewayName;
    
    const response = await apiClient.get('/routes', { params });
    return response.data.data.routes;
  },

  async getHTTPRoute(namespace: string, name: string): Promise<any> {
    const response = await apiClient.get(`/routes/${namespace}/${name}`);
    return response.data.data;
  },

  async createHTTPRoute(route: any): Promise<any> {
    const response = await apiClient.post('/routes', route);
    return response.data.data;
  },

  async updateHTTPRoute(namespace: string, name: string, route: any): Promise<any> {
    const response = await apiClient.put(`/routes/${namespace}/${name}`, route);
    return response.data.data;
  },

  async deleteHTTPRoute(namespace: string, name: string): Promise<any> {
    const response = await apiClient.delete(`/routes/${namespace}/${name}`);
    return response.data.data;
  },

  // Container endpoints
  async getContainers(): Promise<any[]> {
    const response = await apiClient.get('/containers');
    return response.data.data.containers;
  },

  // Metrics endpoints
  async getMetrics(): Promise<any> {
    const response = await apiClient.get('/metrics');
    return response.data.data;
  },

  // YAML configuration
  async applyYAML(yaml: string): Promise<any> {
    const response = await apiClient.post('/config/yaml', { yaml });
    return response.data.data;
  },

  // Namespaces
  async getNamespaces(): Promise<string[]> {
    const response = await apiClient.get('/config/namespaces');
    return response.data.data.namespaces;
  },

  // Services
  async getServices(namespace?: string): Promise<any[]> {
    const params = namespace ? { namespace } : {};
    const response = await apiClient.get('/config/services', { params });
    return response.data.data.services;
  },
};

export default apiService;
