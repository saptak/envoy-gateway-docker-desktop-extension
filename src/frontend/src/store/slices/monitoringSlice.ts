import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MonitoringMetrics, LogEntry } from '@/types';
import { apiService } from '@/services/api';

interface MonitoringState {
  currentMetrics: MonitoringMetrics | null;
  metricsHistory: MonitoringMetrics[];
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  filters: {
    component: string;
    level: string;
    timeRange: string;
  };
  metricsConfig: {
    refreshInterval: number;
    historyDuration: string;
    autoRefresh: boolean;
  };
  logsConfig: {
    maxLines: number;
    autoScroll: boolean;
    realTime: boolean;
  };
}

const initialState: MonitoringState = {
  currentMetrics: null,
  metricsHistory: [],
  logs: [],
  loading: false,
  error: null,
  filters: {
    component: '',
    level: '',
    timeRange: '1h',
  },
  metricsConfig: {
    refreshInterval: 5000, // 5 seconds
    historyDuration: '1h',
    autoRefresh: true,
  },
  logsConfig: {
    maxLines: 1000,
    autoScroll: true,
    realTime: true,
  },
};

// Async thunks
export const fetchMetrics = createAsyncThunk(
  'monitoring/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const metrics = await apiService.getMetrics();
      return metrics;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch metrics');
    }
  }
);

export const fetchMetricsHistory = createAsyncThunk(
  'monitoring/fetchMetricsHistory',
  async (timespan: string, { rejectWithValue }) => {
    try {
      const history = await apiService.getMetricsHistory(timespan);
      return history;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch metrics history');
    }
  }
);

export const fetchLogs = createAsyncThunk(
  'monitoring/fetchLogs',
  async (
    { component, level, limit }: { component?: string; level?: string; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const logs = await apiService.getLogs(component, level, limit);
      return logs;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch logs');
    }
  }
);

const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    updateMetrics: (state, action: PayloadAction<MonitoringMetrics>) => {
      state.currentMetrics = action.payload;
      
      // Add to history
      state.metricsHistory.push(action.payload);
      
      // Keep only the last 100 entries
      if (state.metricsHistory.length > 100) {
        state.metricsHistory = state.metricsHistory.slice(-100);
      }
    },
    addLogEntry: (state, action: PayloadAction<LogEntry>) => {
      state.logs.unshift(action.payload);
      
      // Keep only maxLines entries
      if (state.logs.length > state.logsConfig.maxLines) {
        state.logs = state.logs.slice(0, state.logsConfig.maxLines);
      }
    },
    setFilters: (state, action: PayloadAction<Partial<MonitoringState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setMetricsConfig: (state, action: PayloadAction<Partial<MonitoringState['metricsConfig']>>) => {
      state.metricsConfig = { ...state.metricsConfig, ...action.payload };
    },
    setLogsConfig: (state, action: PayloadAction<Partial<MonitoringState['logsConfig']>>) => {
      state.logsConfig = { ...state.logsConfig, ...action.payload };
    },
    clearLogs: (state) => {
      state.logs = [];
    },
    clearMetricsHistory: (state) => {
      state.metricsHistory = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMetrics
      .addCase(fetchMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMetrics = action.payload;
        
        // Add to history if not already present
        const lastEntry = state.metricsHistory[state.metricsHistory.length - 1];
        if (!lastEntry || lastEntry.timestamp !== action.payload.timestamp) {
          state.metricsHistory.push(action.payload);
          
          // Keep only the last 100 entries
          if (state.metricsHistory.length > 100) {
            state.metricsHistory = state.metricsHistory.slice(-100);
          }
        }
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchMetricsHistory
      .addCase(fetchMetricsHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetricsHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.metricsHistory = action.payload;
        
        // Update current metrics to the latest from history
        if (action.payload.length > 0) {
          state.currentMetrics = action.payload[action.payload.length - 1];
        }
      })
      .addCase(fetchMetricsHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchLogs
      .addCase(fetchLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  updateMetrics,
  addLogEntry,
  setFilters,
  setMetricsConfig,
  setLogsConfig,
  clearLogs,
  clearMetricsHistory,
  clearError,
} = monitoringSlice.actions;

export default monitoringSlice.reducer;
