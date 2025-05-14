import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Define test result interface
export interface TestResult {
  id: string;
  name: string;
  status: 'success' | 'failure' | 'pending' | 'running';
  timestamp: number;
  duration?: number;
  error?: string;
  details?: any;
}

// Define testing state interface
interface TestingState {
  testResults: TestResult[];
  currentTest: TestResult | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: TestingState = {
  testResults: [],
  currentTest: null,
  loading: false,
  error: null,
};

// Create the slice
const testingSlice = createSlice({
  name: 'testing',
  initialState,
  reducers: {
    // Add test result
    addTestResult: (state, action: PayloadAction<TestResult>) => {
      state.testResults.push(action.payload);
    },
    
    // Update test result
    updateTestResult: (state, action: PayloadAction<TestResult>) => {
      const index = state.testResults.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.testResults[index] = action.payload;
      }
    },
    
    // Set current test
    setCurrentTest: (state, action: PayloadAction<TestResult | null>) => {
      state.currentTest = action.payload;
    },
    
    // Clear test results
    clearTestResults: (state) => {
      state.testResults = [];
      state.currentTest = null;
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
  addTestResult,
  updateTestResult,
  setCurrentTest,
  clearTestResults,
  setLoading,
  setError,
} = testingSlice.actions;

// Export selectors
export const selectTestResults = (state: RootState) => state.testing.testResults;
export const selectCurrentTest = (state: RootState) => state.testing.currentTest;
export const selectTestingLoading = (state: RootState) => state.testing.loading;
export const selectTestingError = (state: RootState) => state.testing.error;

// Export reducer
export default testingSlice.reducer;
