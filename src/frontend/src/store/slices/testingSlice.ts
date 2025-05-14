import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TestCollection, TestRun, TestCase, TestResult } from '@/types';
import { apiService } from '@/services/api';

interface TestingState {
  collections: TestCollection[];
  selectedCollection: TestCollection | null;
  testRuns: TestRun[];
  selectedRun: TestRun | null;
  currentResults: TestResult[];
  loading: boolean;
  error: string | null;
  isRunning: boolean;
  runProgress: {
    current: number;
    total: number;
    percentage: number;
  };
}

const initialState: TestingState = {
  collections: [],
  selectedCollection: null,
  testRuns: [],
  selectedRun: null,
  currentResults: [],
  loading: false,
  error: null,
  isRunning: false,
  runProgress: {
    current: 0,
    total: 0,
    percentage: 0,
  },
};

// Async thunks
export const fetchTestCollections = createAsyncThunk(
  'testing/fetchCollections',
  async (_, { rejectWithValue }) => {
    try {
      const collections = await apiService.getTestCollections();
      return collections;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch test collections');
    }
  }
);

export const fetchTestCollection = createAsyncThunk(
  'testing/fetchCollection',
  async (id: string, { rejectWithValue }) => {
    try {
      const collection = await apiService.getTestCollection(id);
      return collection;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch test collection');
    }
  }
);

export const createTestCollection = createAsyncThunk(
  'testing/createCollection',
  async (collection: Partial<TestCollection>, { rejectWithValue }) => {
    try {
      const newCollection = await apiService.createTestCollection(collection);
      return newCollection;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create test collection');
    }
  }
);

export const updateTestCollection = createAsyncThunk(
  'testing/updateCollection',
  async (
    { id, collection }: { id: string; collection: Partial<TestCollection> },
    { rejectWithValue }
  ) => {
    try {
      const updatedCollection = await apiService.updateTestCollection(id, collection);
      return updatedCollection;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update test collection');
    }
  }
);

export const deleteTestCollection = createAsyncThunk(
  'testing/deleteCollection',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiService.deleteTestCollection(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete test collection');
    }
  }
);

export const runTestCollection = createAsyncThunk(
  'testing/runCollection',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setRunning(true));
      const run = await apiService.runTestCollection(id);
      
      // Start polling for results
      dispatch(pollTestRun(run.id));
      
      return run;
    } catch (error: any) {
      dispatch(setRunning(false));
      return rejectWithValue(error.message || 'Failed to run test collection');
    }
  }
);

export const fetchTestRuns = createAsyncThunk(
  'testing/fetchRuns',
  async (collectionId?: string, { rejectWithValue }) => {
    try {
      const runs = await apiService.getTestRuns(collectionId);
      return runs;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch test runs');
    }
  }
);

export const fetchTestRun = createAsyncThunk(
  'testing/fetchRun',
  async (id: string, { rejectWithValue }) => {
    try {
      const run = await apiService.getTestRun(id);
      return run;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch test run');
    }
  }
);

export const executeTest = createAsyncThunk(
  'testing/executeTest',
  async (test: TestCase, { rejectWithValue }) => {
    try {
      const result = await apiService.executeTest(test);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to execute test');
    }
  }
);

// Polling for test run updates
export const pollTestRun = createAsyncThunk(
  'testing/pollTestRun',
  async (runId: string, { rejectWithValue, dispatch }) => {
    const pollInterval = 1000; // 1 second
    const maxPolls = 300; // 5 minutes max
    let polls = 0;

    const poll = async (): Promise<TestRun> => {
      polls++;
      const run = await apiService.getTestRun(runId);
      
      if (run.status === 'running' && polls < maxPolls) {
        setTimeout(() => poll(), pollInterval);
      } else {
        dispatch(setRunning(false));
      }
      
      return run;
    };

    try {
      return await poll();
    } catch (error: any) {
      dispatch(setRunning(false));
      return rejectWithValue(error.message || 'Failed to poll test run');
    }
  }
);

const testingSlice = createSlice({
  name: 'testing',
  initialState,
  reducers: {
    setSelectedCollection: (state, action: PayloadAction<TestCollection | null>) => {
      state.selectedCollection = action.payload;
    },
    setSelectedRun: (state, action: PayloadAction<TestRun | null>) => {
      state.selectedRun = action.payload;
      if (action.payload) {
        state.currentResults = action.payload.results;
      }
    },
    setRunning: (state, action: PayloadAction<boolean>) => {
      state.isRunning = action.payload;
      if (!action.payload) {
        state.runProgress = { current: 0, total: 0, percentage: 0 };
      }
    },
    updateRunProgress: (state, action: PayloadAction<{ current: number; total: number }>) => {
      state.runProgress = {
        current: action.payload.current,
        total: action.payload.total,
        percentage: action.payload.total > 0 ? (action.payload.current / action.payload.total) * 100 : 0,
      };
    },
    addTestResult: (state, action: PayloadAction<TestResult>) => {
      state.currentResults.push(action.payload);
      
      // Update progress
      if (state.selectedRun) {
        state.runProgress.current = state.currentResults.length;
      }
    },
    updateTestRun: (state, action: PayloadAction<TestRun>) => {
      // Update in runs list
      const index = state.testRuns.findIndex(run => run.id === action.payload.id);
      if (index !== -1) {
        state.testRuns[index] = action.payload;
      }
      
      // Update selected run
      if (state.selectedRun?.id === action.payload.id) {
        state.selectedRun = action.payload;
        state.currentResults = action.payload.results;
        
        // Update progress
        state.runProgress = {
          current: action.payload.results.length,
          total: action.payload.summary.total,
          percentage: action.payload.summary.total > 0 
            ? (action.payload.results.length / action.payload.summary.total) * 100 
            : 0,
        };
        
        // Check if run is complete
        if (action.payload.status === 'completed' || action.payload.status === 'failed') {
          state.isRunning = false;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTestCollections
      .addCase(fetchTestCollections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestCollections.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = action.payload;
      })
      .addCase(fetchTestCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchTestCollection
      .addCase(fetchTestCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCollection = action.payload;
        
        // Update in collections list
        const index = state.collections.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.collections[index] = action.payload;
        }
      })
      .addCase(fetchTestCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createTestCollection
      .addCase(createTestCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTestCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.collections.push(action.payload);
        state.selectedCollection = action.payload;
      })
      .addCase(createTestCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateTestCollection
      .addCase(updateTestCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTestCollection.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.collections.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.collections[index] = action.payload;
        }
        if (state.selectedCollection?.id === action.payload.id) {
          state.selectedCollection = action.payload;
        }
      })
      .addCase(updateTestCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // deleteTestCollection
      .addCase(deleteTestCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTestCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = state.collections.filter(c => c.id !== action.payload);
        if (state.selectedCollection?.id === action.payload) {
          state.selectedCollection = null;
        }
      })
      .addCase(deleteTestCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // runTestCollection
      .addCase(runTestCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(runTestCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.testRuns.unshift(action.payload);
        state.selectedRun = action.payload;
        state.currentResults = [];
        state.isRunning = true;
        state.runProgress = {
          current: 0,
          total: action.payload.summary.total,
          percentage: 0,
        };
      })
      .addCase(runTestCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isRunning = false;
      })
      // fetchTestRuns
      .addCase(fetchTestRuns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestRuns.fulfilled, (state, action) => {
        state.loading = false;
        state.testRuns = action.payload;
      })
      .addCase(fetchTestRuns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchTestRun
      .addCase(fetchTestRun.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestRun.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRun = action.payload;
        state.currentResults = action.payload.results;
        
        // Update in runs list
        const index = state.testRuns.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.testRuns[index] = action.payload;
        }
      })
      .addCase(fetchTestRun.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // executeTest
      .addCase(executeTest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(executeTest.fulfilled, (state, action) => {
        state.loading = false;
        state.currentResults.push(action.payload);
      })
      .addCase(executeTest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // pollTestRun
      .addCase(pollTestRun.fulfilled, (state, action) => {
        const index = state.testRuns.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.testRuns[index] = action.payload;
        }
        if (state.selectedRun?.id === action.payload.id) {
          state.selectedRun = action.payload;
          state.currentResults = action.payload.results;
        }
      });
  },
});

export const {
  setSelectedCollection,
  setSelectedRun,
  setRunning,
  updateRunProgress,
  addTestResult,
  updateTestRun,
  clearError,
} = testingSlice.actions;

export default testingSlice.reducer;
