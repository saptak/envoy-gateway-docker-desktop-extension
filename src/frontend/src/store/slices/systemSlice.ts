import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SystemStatus } from '@/types';
import { apiService } from '@/services/api';

interface SystemState {
  status: SystemStatus | null;
  connected: boolean;
  lastUpdated: number | null;
  loading: boolean;
  error: string | null;
  connectionHistory: Array<{
    timestamp: number;
    connected: boolean;
    error?: string;
  }>;
}

const initialState: SystemState = {
  status: null,
  connected: false,
  lastUpdated: null,
  loading: false,
  error: null,
  connectionHistory: [],
};

// Async thunks
export const fetchSystemStatus = createAsyncThunk(
  'system/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const status = await apiService.getSystemStatus();
      return status;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch system status');
    }
  }
);

export const checkHealth = createAsyncThunk(
  'system/checkHealth',
  async (_, { rejectWithValue }) => {
    try {
      const health = await apiService.healthCheck();
      return health;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Health check failed');
    }
  }
);

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      const wasConnected = state.connected;
      state.connected = action.payload;
      
      // Add to connection history
      state.connectionHistory.unshift({
        timestamp: Date.now(),
        connected: action.payload,
      });
      
      // Keep only last 100 entries
      if (state.connectionHistory.length > 100) {
        state.connectionHistory = state.connectionHistory.slice(0, 100);
      }
      
      // Clear error if reconnected
      if (!wasConnected && action.payload) {
        state.error = null;
      }
    },
    updateStatus: (state, action: PayloadAction<SystemStatus>) => {
      state.status = action.payload;
      state.lastUpdated = Date.now();
      state.connected = true;
    },
    addConnectionError: (state, action: PayloadAction<string>) => {
      state.connectionHistory.unshift({
        timestamp: Date.now(),
        connected: false,
        error: action.payload,
      });
      
      if (state.connectionHistory.length > 100) {
        state.connectionHistory = state.connectionHistory.slice(0, 100);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSystemStatus
      .addCase(fetchSystemStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
        state.lastUpdated = Date.now();
        state.connected = true;
        state.error = null;
      })
      .addCase(fetchSystemStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.connected = false;
      })
      // checkHealth
      .addCase(checkHealth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkHealth.fulfilled, (state) => {
        state.loading = false;
        state.connected = true;
        state.lastUpdated = Date.now();
      })
      .addCase(checkHealth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.connected = false;
      });
  },
});

export const { setConnected, updateStatus, addConnectionError, clearError } = systemSlice.actions;

export default systemSlice.reducer;
