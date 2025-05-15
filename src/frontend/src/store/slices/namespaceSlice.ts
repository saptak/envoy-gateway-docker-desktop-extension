import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '@/services/api';

interface NamespaceInfo {
  name: string;
  gatewayCount: number;
  routeCount: number;
  totalResources: number;
  error?: string;
}

interface NamespaceState {
  namespaces: NamespaceInfo[];
  selectedNamespace: string; // Empty string means all namespaces
  loading: boolean;
  error: string | null;
}

const initialState: NamespaceState = {
  namespaces: [],
  selectedNamespace: '', // Default to all namespaces
  loading: false,
  error: null,
};

// Async thunks
export const fetchNamespaces = createAsyncThunk(
  'namespace/fetchNamespaces',
  async (includeEmpty = false, { rejectWithValue }) => {
    try {
      const response = await apiService.getNamespaces(includeEmpty);
      return response.data.namespaces;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch namespaces');
    }
  }
);

const namespaceSlice = createSlice({
  name: 'namespace',
  initialState,
  reducers: {
    setSelectedNamespace: (state, action: PayloadAction<string>) => {
      state.selectedNamespace = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNamespaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNamespaces.fulfilled, (state, action) => {
        state.loading = false;
        state.namespaces = action.payload;
      })
      .addCase(fetchNamespaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedNamespace, clearError } = namespaceSlice.actions;
export default namespaceSlice.reducer;
