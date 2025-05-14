import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Define the container interface
export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'created' | 'paused' | 'restarting' | 'removing' | 'dead';
  created: string;
  ports: Array<{
    privatePort: number;
    publicPort?: number;
    type: string;
  }>;
  networks: string[];
  labels: Record<string, string>;
}

// Define the state interface
interface ContainerState {
  containers: Container[];
  selectedContainer: Container | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: ContainerState = {
  containers: [],
  selectedContainer: null,
  loading: false,
  error: null,
};

// Create the slice
const containerSlice = createSlice({
  name: 'containers',
  initialState,
  reducers: {
    // Set all containers
    setContainers: (state, action: PayloadAction<Container[]>) => {
      state.containers = action.payload;
      state.error = null;
    },
    
    // Set selected container
    setSelectedContainer: (state, action: PayloadAction<Container | null>) => {
      state.selectedContainer = action.payload;
    },
    
    // Update container status
    updateContainerStatus: (state, action: PayloadAction<{ id: string; status: string; state: Container['state'] }>) => {
      const container = state.containers.find(c => c.id === action.payload.id);
      if (container) {
        container.status = action.payload.status;
        container.state = action.payload.state;
        
        // Update selected container if it's the same one
        if (state.selectedContainer && state.selectedContainer.id === action.payload.id) {
          state.selectedContainer = {
            ...state.selectedContainer,
            status: action.payload.status,
            state: action.payload.state,
          };
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
    },
  },
});

// Export actions
export const {
  setContainers,
  setSelectedContainer,
  updateContainerStatus,
  setLoading,
  setError,
} = containerSlice.actions;

// Export selectors
export const selectContainers = (state: RootState) => state.containers.containers;
export const selectSelectedContainer = (state: RootState) => state.containers.selectedContainer;
export const selectContainerLoading = (state: RootState) => state.containers.loading;
export const selectContainerError = (state: RootState) => state.containers.error;

// Export reducer
export default containerSlice.reducer;
