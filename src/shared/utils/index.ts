/**
 * Utility functions for the application
 */

/**
 * Get color for status badge based on status value
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'ready':
    case 'running':
    case 'healthy':
    case 'connected':
    case 'active':
    case 'success':
    case 'passed':
      return 'success';
      
    case 'pending':
    case 'starting':
    case 'loading':
    case 'waiting':
    case 'progressing':
      return 'warning';
      
    case 'error':
    case 'failed':
    case 'disconnected':
    case 'unhealthy':
    case 'stopped':
    case 'terminated':
      return 'error';
      
    case 'unknown':
    case 'undefined':
    default:
      return 'default';
  }
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Debounce function execution
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(undefined, args), wait);
  };
};

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Generate a random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

/**
 * Validate Kubernetes resource name
 */
export const validateKubernetesName = (name: string): boolean => {
  // Kubernetes name must be lowercase alphanumeric characters or hyphens
  // Must start and end with alphanumeric character
  const regex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
  return regex.test(name) && name.length <= 63;
};

/**
 * Convert camelCase to kebab-case
 */
export const camelToKebab = (str: string): string => {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * Convert kebab-case to camelCase
 */
export const kebabToCamel = (str: string): string => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

// Re-export all utilities as default
export default {
  getStatusColor,
  formatBytes,
  debounce,
  capitalize,
  deepClone,
  isEmpty,
  generateId,
  formatNumber,
  truncateText,
  validateKubernetesName,
  camelToKebab,
  kebabToCamel,
};
