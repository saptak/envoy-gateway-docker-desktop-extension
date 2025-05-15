import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Gateway } from '@/types';
import { apiService } from '@/services/api';

interface NamespaceInfo {
  name: string;
  gatewayCount: number;
  routeCount: number;
  totalResources: number;
  error?: string;
}

interface GatewayState {
  gateways: Gateway[];
  selectedGateway: Gateway | null;
  namespaces: NamespaceInfo[];
  namespaceCounts: Record<string, number>;
  loading: boolean;
  error: string | null;
  filters: {
    namespace: string;
    status: string;
    search: string;
    showAllNamespaces: boolean;
  };
  sortBy: 'name' | 'namespace' | 'created' | 'status';
  sortOrder: 'asc' | 'desc';
  total: number;
}

const initialState: GatewayState = {
  gateways: [],
  selectedGateway: null,
  namespaces: [],
  namespaceCounts: {},
  loading: false,
  error: null,
  filters: {
    namespace: '',
    status: '',
    search: '',
    showAllNamespaces: true, // Default to showing all namespaces
  },
  sortBy: 'name',
  sortOrder: 'asc',
  total: 0,
};

// Async thunks
export const fetchNamespaces = createAsyncThunk(
  'gateways/fetchNamespaces',
  async (includeEmpty = false, { rejectWithValue }) => {
    try {
      const namespaces = await apiService.getNamespaces(includeEmpty);
      return namespaces;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch namespaces');
    }
  }
);

export const fetchGateways = createAsyncThunk(
  'gateways/fetchGateways',
  async (options: { namespace?: string; showAllNamespaces?: boolean } = {}, { rejectWithValue }) => {
    try {
      if (options.showAllNamespaces || !options.namespace) {
        // Fetch gateways across all namespaces
        const result = await apiService.getGatewaysAcrossAllNamespaces();
        return {
          gateways: result.gateways,
          total: result.total,
          namespaceCounts: result.namespaceCounts,
          isAllNamespaces: true,
        };
      } else {
        // Fetch gateways from specific namespace
        const gateways = await apiService.getGateways({ namespace: options.namespace });
        return {
          gateways,
          total: gateways.length,
          namespaceCounts: { [options.namespace]: gateways.length },
          isAllNamespaces: false,
        };
      }
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
    setNamespaceFilter: (state, action: PayloadAction<string>) => {
      state.filters.namespace = action.payload;
      state.filters.showAllNamespaces = !action.payload;
    },
    toggleShowAllNamespaces: (state) => {
      state.filters.showAllNamespaces = !state.filters.showAllNamespaces;
      if (state.filters.showAllNamespaces) {
        state.filters.namespace = '';
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNamespaces
      .addCase(fetchNamespaces.pending, (state) => {
        // Don't set loading for namespaces to avoid blocking UI
      })
      .addCase(fetchNamespaces.fulfilled, (state, action) => {
        state.namespaces = action.payload;
      })
      .addCase(fetchNamespaces.rejected, (state, action) => {
        console.warn('Failed to fetch namespaces:', action.payload);
      })
      // fetchGateways
      .addCase(fetchGateways.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGateways.fulfilled, (state, action) => {
        state.loading = false;
        state.gateways = action.payload.gateways;
        state.total = action.payload.total;
        state.namespaceCounts = action.payload.namespaceCounts;
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
        
        // Update namespace count
        const namespace = action.payload.namespace;
        state.namespaceCounts[namespace] = (state.namespaceCounts[namespace] || 0) + 1;
        state.total += 1;
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
        
        // Update namespace count
        const namespace = action.payload.namespace;
        if (state.namespaceCounts[namespace] > 0) {
          state.namespaceCounts[namespace] -= 1;
        }
        state.total -= 1;
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
  setNamespaceFilter,
  toggleShowAllNamespaces,
} = gatewaySlice.actions;

export default gatewaySlice.reducer;