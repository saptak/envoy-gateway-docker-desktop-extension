import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DockerContainer } from '@/types';
import { apiService } from '@/services/api';

interface ContainerState {
  containers: DockerContainer[];
  selectedContainer: DockerContainer | null;
  logs: { [containerId: string]: string[] };
  loading: boolean;
  error: string | null;
  filters: {
    state: string;
    image: string;
    search: string;
  };
  sortBy: 'name' | 'image' | 'state' | 'created';
  sortOrder: 'asc' | 'desc';
}

const initialState: ContainerState = {
  containers: [],
  selectedContainer: null,
  logs: {},
  loading: false,
  error: null,
  filters: {
    state: '',
    image: '',
    search: '',
  },
  sortBy: 'name',
  sortOrder: 'asc',
};

// Async thunks
export const fetchContainers = createAsyncThunk(
  'containers/fetchContainers',
  async (_, { rejectWithValue }) => {
    try {
      const containers = await apiService.getContainers();
      return containers;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch containers');
    }
  }
);

export const fetchContainer = createAsyncThunk(
  'containers/fetchContainer',
  async (id: string, { rejectWithValue }) => {
    try {
      const container = await apiService.getContainer(id);
      return container;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch container');
    }
  }
);

export const createContainer = createAsyncThunk(
  'containers/createContainer',
  async (config: any, { rejectWithValue }) => {
    try {
      const container = await apiService.createContainer(config);
      return container;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create container');
    }
  }
);

export const startContainer = createAsyncThunk(
  'containers/startContainer',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await apiService.startContainer(id);
      // Refresh the container to get updated status
      dispatch(fetchContainer(id));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to start container');
    }
  }
);

export const stopContainer = createAsyncThunk(
  'containers/stopContainer',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await apiService.stopContainer(id);
      // Refresh the container to get updated status
      dispatch(fetchContainer(id));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to stop container');
    }
  }
);

export const removeContainer = createAsyncThunk(
  'containers/removeContainer',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiService.removeContainer(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove container');
    }
  }
);

export const fetchContainerLogs = createAsyncThunk(
  'containers/fetchLogs',
  async ({ id, tail }: { id: string; tail?: number }, { rejectWithValue }) => {
    try {
      const logs = await apiService.getContainerLogs(id, tail);
      return { id, logs };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch container logs');
    }
  }
);

const containerSlice = createSlice({
  name: 'containers',
  initialState,
  reducers: {
    setSelectedContainer: (state, action: PayloadAction<DockerContainer | null>) => {
      state.selectedContainer = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ContainerState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSorting: (state, action: PayloadAction<{ sortBy: ContainerState['sortBy']; sortOrder: ContainerState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    updateContainerStatus: (state, action: PayloadAction<DockerContainer>) => {
      const index = state.containers.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.containers[index] = action.payload;
      }
      if (state.selectedContainer?.id === action.payload.id) {
        state.selectedContainer = action.payload;
      }
    },
    appendContainerLogs: (state, action: PayloadAction<{ id: string; logs: string[] }>) => {
      const { id, logs } = action.payload;
      if (state.logs[id]) {
        state.logs[id].push(...logs);
        // Keep only last 1000 lines
        if (state.logs[id].length > 1000) {
          state.logs[id] = state.logs[id].slice(-1000);
        }
      } else {
        state.logs[id] = logs;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchContainers
      .addCase(fetchContainers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContainers.fulfilled, (state, action) => {
        state.loading = false;
        state.containers = action.payload;
      })
      .addCase(fetchContainers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchContainer
      .addCase(fetchContainer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContainer.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedContainer = action.payload;
        
        // Update in the list if it exists
        const index = state.containers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.containers[index] = action.payload;
        } else {
          state.containers.push(action.payload);
        }
      })
      .addCase(fetchContainer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createContainer
      .addCase(createContainer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createContainer.fulfilled, (state, action) => {
        state.loading = false;
        state.containers.push(action.payload);
        state.selectedContainer = action.payload;
      })
      .addCase(createContainer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // startContainer
      .addCase(startContainer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startContainer.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(startContainer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // stopContainer
      .addCase(stopContainer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopContainer.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(stopContainer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // removeContainer
      .addCase(removeContainer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeContainer.fulfilled, (state, action) => {
        state.loading = false;
        state.containers = state.containers.filter(c => c.id !== action.payload);
        if (state.selectedContainer?.id === action.payload) {
          state.selectedContainer = null;
        }
        // Clear logs for removed container
        delete state.logs[action.payload];
      })
      .addCase(removeContainer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchContainerLogs
      .addCase(fetchContainerLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContainerLogs.fulfilled, (state, action) => {
        state.loading = false;
        const { id, logs } = action.payload;
        state.logs[id] = logs;
      })
      .addCase(fetchContainerLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedContainer,
  setFilters,
  setSorting,
  updateContainerStatus,
  appendContainerLogs,
  clearError,
} = containerSlice.actions;

export default containerSlice.reducer;
