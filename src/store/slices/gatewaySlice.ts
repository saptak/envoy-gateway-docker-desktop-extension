import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Define the gateway interface
export interface Gateway {
  id: string;
  name: string;
  namespace: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  listeners: any[];
  spec: any;
}

// Define the state interface
interface GatewayState {
  gateways: Gateway[];
  selectedGateway: Gateway | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: GatewayState = {
  gateways: [],
  selectedGateway: null,
  loading: false,
  error: null,
};

// Create the slice
const gatewaySlice = createSlice({
  name: 'gateways',
  initialState,
  reducers: {
    // Set all gateways
    setGateways: (state, action: PayloadAction<Gateway[]>) => {
      state.gateways = action.payload;
      state.error = null;
    },
    
    // Set selected gateway
    setSelectedGateway: (state, action: PayloadAction<Gateway | null>) => {
      state.selectedGateway = action.payload;
    },
    
    // Add a new gateway
    addGateway: (state, action: PayloadAction<Gateway>) => {
      state.gateways.push(action.payload);
    },
    
    // Update an existing gateway
    updateGateway: (state, action: PayloadAction<Gateway>) => {
      const index = state.gateways.findIndex(g => 
        g.namespace === action.payload.namespace && g.name === action.payload.name
      );
      
      if (index !== -1) {
        state.gateways[index] = action.payload;
        
        // Update selected gateway if it's the same one
        if (state.selectedGateway && 
            state.selectedGateway.namespace === action.payload.namespace && 
            state.selectedGateway.name === action.payload.name) {
          state.selectedGateway = action.payload;
        }
      }
    },
    
    // Remove a gateway
    removeGateway: (state, action: PayloadAction<{ namespace: string; name: string }>) => {
      state.gateways = state.gateways.filter(
        g => !(g.namespace === action.payload.namespace && g.name === action.payload.name)
      );
      
      // Clear selected gateway if it's the same one
      if (state.selectedGateway && 
          state.selectedGateway.namespace === action.payload.namespace && 
          state.selectedGateway.name === action.payload.name) {
        state.selectedGateway = null;
      }
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
  setGateways,
  setSelectedGateway,
  addGateway,
  updateGateway,
  removeGateway,
  setLoading,
  setError,
} = gatewaySlice.actions;

// Export selectors
export const selectGateways = (state: RootState) => state.gateways.gateways;
export const selectSelectedGateway = (state: RootState) => state.gateways.selectedGateway;
export const selectGatewayLoading = (state: RootState) => state.gateways.loading;
export const selectGatewayError = (state: RootState) => state.gateways.error;

// Export reducer
export default gatewaySlice.reducer;
