import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Define metrics interface
export interface Metrics {
  timestamp: number;
  gateways: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  routes: {
    total: number;
    attached: number;
    detached: number;
  };
  traffic: {
    requestRate: number;
    errorRate: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
  };
  resources: {
    cpu: {
      usage: number;
      limit: number;
    };
    memory: {
      usage: number;
      limit: number;
    };
  };
}

// Define metrics history entry
export interface MetricsHistoryEntry {
  timestamp: number;
  metrics: Metrics;
}

// Define monitoring state interface
interface MonitoringState {
  metrics: Metrics | null;
  metricsHistory: MetricsHistoryEntry[];
  historyLimit: number;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: MonitoringState = {
  metrics: null,
  metricsHistory: [],
  historyLimit: 100, // Keep last 100 metrics entries
  loading: false,
  error: null,
};

// Create the slice
const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    // Set current metrics
    setMetrics: (state, action: PayloadAction<Metrics>) => {
      state.metrics = action.payload;
      
      // Add to history
      state.metricsHistory.push({
        timestamp: action.payload.timestamp,
        metrics: action.payload,
      });
      
      // Limit history size
      if (state.metricsHistory.length > state.historyLimit) {
        state.metricsHistory = state.metricsHistory.slice(-state.historyLimit);
      }
      
      state.error = null;
    },
    
    // Set metrics history
    setMetricsHistory: (state, action: PayloadAction<MetricsHistoryEntry[]>) => {
      state.metricsHistory = action.payload;
      
      // Limit history size
      if (state.metricsHistory.length > state.historyLimit) {
        state.metricsHistory = state.metricsHistory.slice(-state.historyLimit);
      }
    },
    
    // Set history limit
    setHistoryLimit: (state, action: PayloadAction<number>) => {
      state.historyLimit = action.payload;
      
      // Apply new limit to existing history
      if (state.metricsHistory.length > action.payload) {
        state.metricsHistory = state.metricsHistory.slice(-action.payload);
      }
    },
    
    // Clear metrics history
    clearMetricsHistory: (state) => {
      state.metricsHistory = [];
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Export actions
export const {
  setMetrics,
  setMetricsHistory,
  setHistoryLimit,
  clearMetricsHistory,
  setLoading,
  setError,
} = monitoringSlice.actions;

// Export selectors
export const selectMetrics = (state: RootState) => state.monitoring.metrics;
export const selectMetricsHistory = (state: RootState) => state.monitoring.metricsHistory;
export const selectHistoryLimit = (state: RootState) => state.monitoring.historyLimit;
export const selectMonitoringLoading = (state: RootState) => state.monitoring.loading;
export const selectMonitoringError = (state: RootState) => state.monitoring.error;

// Export reducer
export default monitoringSlice.reducer;
