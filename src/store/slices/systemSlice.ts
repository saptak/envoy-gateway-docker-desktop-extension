import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Define system status interface
export interface SystemStatus {
  docker: {
    connected: boolean;
    version?: string;
    containers?: {
      running: number;
      stopped: number;
      total: number;
    };
  };
  kubernetes: {
    connected: boolean;
    context?: string;
    namespace?: string;
    version?: string;
  };
  envoyGateway: {
    installed: boolean;
    status: 'running' | 'stopped' | 'error' | 'not-installed';
    version?: string;
  };
}

// Define connection history entry
export interface ConnectionHistoryEntry {
  timestamp: number;
  status: 'connected' | 'disconnected';
  reason?: string;
}

// Define system state interface
interface SystemState {
  status: SystemStatus | null;
  connected: boolean;
  lastUpdated: number | null;
  loading: boolean;
  error: string | null;
  connectionHistory: ConnectionHistoryEntry[];
}

// Initial state
const initialState: SystemState = {
  status: null,
  connected: false,
  lastUpdated: null,
  loading: false,
  error: null,
  connectionHistory: [],
};

// Create the slice
const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    // Set system status
    setSystemStatus: (state, action: PayloadAction<SystemStatus>) => {
      state.status = action.payload;
      state.connected = true;
      state.lastUpdated = Date.now();
      state.error = null;
      
      // Add to connection history if status changed
      if (!state.connected) {
        state.connectionHistory.push({
          timestamp: Date.now(),
          status: 'connected',
        });
      }
    },
    
    // Set connection status
    setConnected: (state, action: PayloadAction<boolean>) => {
      // Only update if the status is changing
      if (state.connected !== action.payload) {
        state.connected = action.payload;
        
        // Add to connection history
        state.connectionHistory.push({
          timestamp: Date.now(),
          status: action.payload ? 'connected' : 'disconnected',
        });
        
        // Keep only the last 100 entries
        if (state.connectionHistory.length > 100) {
          state.connectionHistory = state.connectionHistory.slice(-100);
        }
      }
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      
      // If there's an error, mark as disconnected
      if (action.payload) {
        state.connected = false;
        
        // Add to connection history
        state.connectionHistory.push({
          timestamp: Date.now(),
          status: 'disconnected',
          reason: action.payload,
        });
        
        // Keep only the last 100 entries
        if (state.connectionHistory.length > 100) {
          state.connectionHistory = state.connectionHistory.slice(-100);
        }
      }
    },
    
    // Clear connection history
    clearConnectionHistory: (state) => {
      state.connectionHistory = [];
    },
  },
});

// Export actions
export const {
  setSystemStatus,
  setConnected,
  setLoading,
  setError,
  clearConnectionHistory,
} = systemSlice.actions;

// Export selectors
export const selectSystemStatus = (state: RootState) => state.system.status;
export const selectConnected = (state: RootState) => state.system.connected;
export const selectLastUpdated = (state: RootState) => state.system.lastUpdated;
export const selectSystemLoading = (state: RootState) => state.system.loading;
export const selectSystemError = (state: RootState) => state.system.error;
export const selectConnectionHistory = (state: RootState) => state.system.connectionHistory;

// Export reducer
export default systemSlice.reducer;
