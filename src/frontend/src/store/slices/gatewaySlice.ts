import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Gateway } from '@/types';
import { apiService } from '@/services/api';

interface GatewayState {
  gateways: Gateway[];
  selectedGateway: Gateway | null;
  loading: boolean;
  error: string | null;
  filters: {
    namespace: string;
    status: string;
    search: string;
  };
  sortBy: 'name' | 'namespace' | 'created' | 'status';
  sortOrder: 'asc' | 'desc';
}

const initialState: GatewayState = {
  gateways: [],
  selectedGateway: null,
  loading: false,
  error: null,
  filters: {
    namespace: '',
    status: '',
    search: '',
  },
  sortBy: 'name',
  sortOrder: 'asc',
};

// Async thunks
export const fetchGateways = createAsyncThunk(
  'gateways/fetchGateways',
  async (_, { rejectWithValue }) => {
    try {
      const gateways = await apiService.getGateways();
      return gateways;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch gateways');
    }
  }
);

export const fetchGateway = createAsyncThunk(
  'gateways/fetchGateway',
  async ({ namespace, name }: { namespace: string; name: string }, { rejectWithValue }) => {
    try {
      const gateway = await apiService.getGateway(namespace, name);
      return gateway;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch gateway');
    }
  }
);

export const createGateway = createAsyncThunk(
  'gateways/createGateway',
  async (gateway: Partial<Gateway>, { rejectWithValue }) => {
    try {
      const newGateway = await apiService.createGateway(gateway);
      return newGateway;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create gateway');
    }
  }
);

export const updateGateway = createAsyncThunk(
  'gateways/updateGateway',
  async (
    { namespace, name, gateway }: { namespace: string; name: string; gateway: Partial<Gateway> },
    { rejectWithValue }
  ) => {
    try {
      const updatedGateway = await apiService.updateGateway(namespace, name, gateway);
      return updatedGateway;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update gateway');
    }
  }
);

export const deleteGateway = createAsyncThunk(
  'gateways/deleteGateway',
  async ({ namespace, name }: { namespace: string; name: string }, { rejectWithValue }) => {
    try {
      await apiService.deleteGateway(namespace, name);
      return { namespace, name };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete gateway');
    }
  }
);

const gatewaySlice = createSlice({
  name: 'gateways',
  initialState,
  reducers: {
    setSelectedGateway: (state, action: PayloadAction<Gateway | null>) => {
      state.selectedGateway = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<GatewayState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSorting: (state, action: PayloadAction<{ sortBy: GatewayState['sortBy']; sortOrder: GatewayState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    updateGatewayStatus: (state, action: PayloadAction<Gateway>) => {
      const index = state.gateways.findIndex(
        g => g.namespace === action.payload.namespace && g.name === action.payload.name
      );
      if (index !== -1) {
        state.gateways[index] = action.payload;
      }
      if (state.selectedGateway?.id === action.payload.id) {
        state.selectedGateway = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchGateways
      .addCase(fetchGateways.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGateways.fulfilled, (state, action) => {
        state.loading = false;
        state.gateways = action.payload;
      })
      .addCase(fetchGateways.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchGateway
      .addCase(fetchGateway.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGateway.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedGateway = action.payload;
        
        // Update in the list if it exists
        const index = state.gateways.findIndex(
          g => g.namespace === action.payload.namespace && g.name === action.payload.name
        );
        if (index !== -1) {
          state.gateways[index] = action.payload;
        }
      })
      .addCase(fetchGateway.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createGateway
      .addCase(createGateway.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGateway.fulfilled, (state, action) => {
        state.loading = false;
        state.gateways.push(action.payload);
        state.selectedGateway = action.payload;
      })
      .addCase(createGateway.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateGateway
      .addCase(updateGateway.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGateway.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gateways.findIndex(
          g => g.namespace === action.payload.namespace && g.name === action.payload.name
        );
        if (index !== -1) {
          state.gateways[index] = action.payload;
        }
        if (state.selectedGateway?.id === action.payload.id) {
          state.selectedGateway = action.payload;
        }
      })
      .addCase(updateGateway.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // deleteGateway
      .addCase(deleteGateway.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGateway.fulfilled, (state, action) => {
        state.loading = false;
        state.gateways = state.gateways.filter(
          g => !(g.namespace === action.payload.namespace && g.name === action.payload.name)
        );
        if (
          state.selectedGateway?.namespace === action.payload.namespace &&
          state.selectedGateway?.name === action.payload.name
        ) {
          state.selectedGateway = null;
        }
      })
      .addCase(deleteGateway.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedGateway,
  setFilters,
  setSorting,
  updateGatewayStatus,
  clearError,
} = gatewaySlice.actions;

export default gatewaySlice.reducer;
