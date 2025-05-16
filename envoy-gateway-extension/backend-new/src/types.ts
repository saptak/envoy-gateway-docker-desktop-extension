// Error handling types
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// Error codes
export enum ErrorCodes {
  // Kubernetes connection errors
  KUBERNETES_CONNECTION_FAILED = 'KUBERNETES_CONNECTION_FAILED',
  KUBERNETES_NOT_AVAILABLE = 'KUBERNETES_NOT_AVAILABLE',
  KUBERNETES_PERMISSION_DENIED = 'KUBERNETES_PERMISSION_DENIED',
  
  // Resource errors
  GATEWAY_NOT_FOUND = 'GATEWAY_NOT_FOUND',
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
  NAMESPACE_NOT_FOUND = 'NAMESPACE_NOT_FOUND',
  
  // Creation/modification errors
  GATEWAY_CREATION_FAILED = 'GATEWAY_CREATION_FAILED',
  ROUTE_CREATION_FAILED = 'ROUTE_CREATION_FAILED',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST_BODY = 'INVALID_REQUEST_BODY',
  
  // Network and timeout errors
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Business logic types
export interface Namespace {
  name: string;
  status: string;
  createdAt: Date;
}

export interface Gateway {
  name: string;
  namespace: string;
  status: string;
  gatewayClassName: string;
  listeners: Array<{
    name: string;
    port: number;
    protocol: string;
  }>;
  createdAt: Date;
}

export interface Route {
  name: string;
  namespace: string;
  status: string;
  hostnames: string[];
  rules: Array<{
    path: string;
  }>;
  createdAt: Date;
}

export interface KubernetesConfig {
  enabled: boolean;
  connected: boolean;
  contextName: string;
  error?: string;
}

export interface QuickSetupStatus {
  dockerDesktopRunning: boolean;
  kubernetesEnabled: boolean;
  envoyGatewayInstalled: boolean;
  namespaceReady: boolean;
  gatewayClassCreated: boolean;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}
