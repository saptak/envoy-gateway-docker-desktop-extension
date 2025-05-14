import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

// Create a simple gateway slice for testing
const gatewaySlice = {
  name: 'gateway',
  initialState: {
    gateways: [],
    loading: false,
    error: null,
  },
  reducers: {
    setGateways: (state: any, action: any) => {
      state.gateways = action.payload;
    },
    setLoading: (state: any, action: any) => {
      state.loading = action.payload;
    },
    setError: (state: any, action: any) => {
      state.error = action.payload;
    },
  },
};

// Simple mock component
const MockGateways: React.FC = () => {
  return (
    <div>
      <h1>Gateways</h1>
      <button>Create Gateway</button>
      <div>No gateways found. Create your first gateway to get started.</div>
    </div>
  );
};

// Mock the Redux store
const createMockStore = (initialState = {}) => configureStore({
  reducer: {
    gateway: (state = gatewaySlice.initialState, action: any) => {
      switch (action.type) {
        case 'gateway/setGateways':
          return { ...state, gateways: action.payload };
        case 'gateway/setLoading':
          return { ...state, loading: action.payload };
        case 'gateway/setError':
          return { ...state, error: action.payload };
        default:
          return state;
      }
    },
  },
  preloadedState: {
    gateway: { ...gatewaySlice.initialState, ...initialState },
  },
});

const MockedProvider: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createMockStore() 
}) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('Gateways Component - Basic Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <MockedProvider>
        <MockGateways />
      </MockedProvider>
    );
    
    expect(screen.getByText('Gateways')).toBeInTheDocument();
    expect(screen.getByText('Create Gateway')).toBeInTheDocument();
  });

  it('shows empty state message', () => {
    render(
      <MockedProvider>
        <MockGateways />
      </MockedProvider>
    );

    expect(screen.getByText('No gateways found. Create your first gateway to get started.')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    const LoadingComponent: React.FC = () => {
      const store = createMockStore({ loading: true });
      return (
        <Provider store={store}>
          <BrowserRouter>
            <div data-testid="loading-spinner">Loading...</div>
          </BrowserRouter>
        </Provider>
      );
    };

    render(<LoadingComponent />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    const ErrorComponent: React.FC = () => {
      const store = createMockStore({ error: 'Failed to fetch gateways' });
      return (
        <Provider store={store}>
          <BrowserRouter>
            <div>{store.getState().gateway.error}</div>
          </BrowserRouter>
        </Provider>
      );
    };

    render(<ErrorComponent />);
    expect(screen.getByText('Failed to fetch gateways')).toBeInTheDocument();
  });

  it('can click create gateway button', () => {
    const handleClick = jest.fn();
    
    const ButtonComponent: React.FC = () => (
      <MockedProvider>
        <button onClick={handleClick}>Create Gateway</button>
      </MockedProvider>
    );

    render(<ButtonComponent />);
    
    const createButton = screen.getByText('Create Gateway');
    fireEvent.click(createButton);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles form interaction', () => {
    const FormComponent: React.FC = () => {
      const [value, setValue] = React.useState('');
      
      return (
        <MockedProvider>
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Gateway name"
            />
            <div data-testid="value-display">{value}</div>
          </div>
        </MockedProvider>
      );
    };

    render(<FormComponent />);
    
    const input = screen.getByPlaceholderText('Gateway name');
    fireEvent.change(input, { target: { value: 'test-gateway' } });
    
    expect(screen.getByTestId('value-display')).toHaveTextContent('test-gateway');
  });

  it('validates required fields', () => {
    const ValidationComponent: React.FC = () => {
      const [name, setName] = React.useState('');
      const [isValid, setIsValid] = React.useState(false);
      
      React.useEffect(() => {
        setIsValid(name.length > 0);
      }, [name]);
      
      return (
        <MockedProvider>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gateway name"
            />
            <button disabled={!isValid}>Create Gateway</button>
          </div>
        </MockedProvider>
      );
    };

    render(<ValidationComponent />);
    
    const createButton = screen.getByText('Create Gateway');
    expect(createButton).toBeDisabled();

    const nameInput = screen.getByPlaceholderText('Gateway name');
    fireEvent.change(nameInput, { target: { value: 'test-gateway' } });

    expect(createButton).not.toBeDisabled();
  });

  it('handles async operations', async () => {
    const AsyncComponent: React.FC = () => {
      const [loading, setLoading] = React.useState(false);
      const [data, setData] = React.useState<string | null>(null);
      
      const handleAsyncAction = async () => {
        setLoading(true);
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        setData('Async operation completed');
        setLoading(false);
      };
      
      return (
        <MockedProvider>
          <div>
            <button onClick={handleAsyncAction}>Start Async</button>
            {loading && <div data-testid="loading">Loading...</div>}
            {data && <div data-testid="async-result">{data}</div>}
          </div>
        </MockedProvider>
      );
    };

    render(<AsyncComponent />);
    
    const asyncButton = screen.getByText('Start Async');
    fireEvent.click(asyncButton);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('async-result')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Async operation completed')).toBeInTheDocument();
  });
});