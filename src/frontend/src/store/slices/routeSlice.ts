import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HTTPRoute } from '@/types';
import { apiService } from '@/services/api';

interface RouteState {
  routes: HTTPRoute[];
  selectedRoute: HTTPRoute | null;
  loading: boolean;
  error: string | null;
  filters: {
    namespace: string;
    gateway: string;
    status: string;
    search: string;
  };
  sortBy: 'name' | 'namespace' | 'created' | 'gateway';
  sortOrder: 'asc' | 'desc';
}

const initialState: RouteState = {
  routes: [],
  selectedRoute: null,
  loading: false,
  error: null,
  filters: {
    namespace: '',
    gateway: '',
    status: '',
    search: '',
  },
  sortBy: 'name',
  sortOrder: 'asc',
};

// Async thunks
export const fetchRoutes = createAsyncThunk(
  'routes/fetchRoutes',
  async (_, { rejectWithValue }) => {
    try {
      const routes = await apiService.getHTTPRoutes();
      return routes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch routes');
    }
  }
);

export const fetchRoute = createAsyncThunk(
  'routes/fetchRoute',
  async ({ namespace, name }: { namespace: string; name: string }, { rejectWithValue }) => {
    try {
      const route = await apiService.getHTTPRoute(namespace, name);
      return route;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch route');
    }
  }
);

export const createRoute = createAsyncThunk(
  'routes/createRoute',
  async (route: Partial<HTTPRoute>, { rejectWithValue }) => {
    try {
      const newRoute = await apiService.createHTTPRoute(route);
      return newRoute;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create route');
    }
  }
);

export const updateRoute = createAsyncThunk(
  'routes/updateRoute',
  async (
    { namespace, name, route }: { namespace: string; name: string; route: Partial<HTTPRoute> },
    { rejectWithValue }
  ) => {
    try {
      const updatedRoute = await apiService.updateHTTPRoute(namespace, name, route);
      return updatedRoute;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update route');
    }
  }
);

export const deleteRoute = createAsyncThunk(
  'routes/deleteRoute',
  async ({ namespace, name }: { namespace: string; name: string }, { rejectWithValue }) => {
    try {
      await apiService.deleteHTTPRoute(namespace, name);
      return { namespace, name };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete route');
    }
  }
);

const routeSlice = createSlice({
  name: 'routes',
  initialState,
  reducers: {
    setSelectedRoute: (state, action: PayloadAction<HTTPRoute | null>) => {
      state.selectedRoute = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<RouteState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSorting: (state, action: PayloadAction<{ sortBy: RouteState['sortBy']; sortOrder: RouteState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    updateRouteStatus: (state, action: PayloadAction<HTTPRoute>) => {
      const index = state.routes.findIndex(
        r => r.namespace === action.payload.namespace && r.name === action.payload.name
      );
      if (index !== -1) {
        state.routes[index] = action.payload;
      }
      if (state.selectedRoute?.id === action.payload.id) {
        state.selectedRoute = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRoutes
      .addCase(fetchRoutes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.routes = action.payload;
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchRoute
      .addCase(fetchRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoute.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRoute = action.payload;
        
        // Update in the list if it exists
        const index = state.routes.findIndex(
          r => r.namespace === action.payload.namespace && r.name === action.payload.name
        );
        if (index !== -1) {
          state.routes[index] = action.payload;
        }
      })
      .addCase(fetchRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createRoute
      .addCase(createRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoute.fulfilled, (state, action) => {
        state.loading = false;
        state.routes.push(action.payload);
        state.selectedRoute = action.payload;
      })
      .addCase(createRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateRoute
      .addCase(updateRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRoute.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.routes.findIndex(
          r => r.namespace === action.payload.namespace && r.name === action.payload.name
        );
        if (index !== -1) {
          state.routes[index] = action.payload;
        }
        if (state.selectedRoute?.id === action.payload.id) {
          state.selectedRoute = action.payload;
        }
      })
      .addCase(updateRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // deleteRoute
      .addCase(deleteRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRoute.fulfilled, (state, action) => {
        state.loading = false;
        state.routes = state.routes.filter(
          r => !(r.namespace === action.payload.namespace && r.name === action.payload.name)
        );
        if (
          state.selectedRoute?.namespace === action.payload.namespace &&
          state.selectedRoute?.name === action.payload.name
        ) {
          state.selectedRoute = null;
        }
      })
      .addCase(deleteRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedRoute,
  setFilters,
  setSorting,
  updateRouteStatus,
  clearError,
} = routeSlice.actions;

export default routeSlice.reducer;
