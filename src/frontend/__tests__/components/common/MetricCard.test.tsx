import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MetricCard from '../../../components/common/MetricCard';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe('MetricCard Component', () => {
  test('renders with basic props', () => {
    render(
      <TestWrapper>
        <MetricCard title="Test Metric" value={100} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  test('renders with unit', () => {
    render(
      <TestWrapper>
        <MetricCard title="Memory Usage" value={75} unit="%" />
      </TestWrapper>
    );

    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  test('renders with change indicator - increase', () => {
    render(
      <TestWrapper>
        <MetricCard 
          title="CPU Usage" 
          value={45} 
          change={{ value: 15, type: 'increase', period: 'last hour' }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText(/↑ 15% last hour/)).toBeInTheDocument();
  });

  test('renders with change indicator - decrease', () => {
    render(
      <TestWrapper>
        <MetricCard 
          title="Response Time" 
          value={120} 
          change={{ value: 10, type: 'decrease', period: 'last 5min' }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Response Time')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText(/↓ 10% last 5min/)).toBeInTheDocument();
  });

  test('renders with different colors', () => {
    render(
      <TestWrapper>
        <MetricCard title="Error Rate" value={5} color="error" />
      </TestWrapper>
    );

    expect(screen.getByText('Error Rate')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(
      <TestWrapper>
        <MetricCard title="Clickable Metric" value={42} onClick={handleClick} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Clickable Metric'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    render(
      <TestWrapper>
        <MetricCard title="Loading Metric" value={0} loading={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading Metric')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders with trend data', () => {
    const trendData = [10, 15, 12, 18, 22, 25, 20];
    render(
      <TestWrapper>
        <MetricCard title="Trend Metric" value={25} trend={trendData} />
      </TestWrapper>
    );

    expect(screen.getByText('Trend Metric')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    
    // Check if SVG is rendered for trend
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('formats string values correctly', () => {
    render(
      <TestWrapper>
        <MetricCard title="String Value" value="Connected" />
      </TestWrapper>
    );

    expect(screen.getByText('String Value')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  test('formats large number values with commas', () => {
    render(
      <TestWrapper>
        <MetricCard title="Large Number" value={1234567} />
      </TestWrapper>
    );

    expect(screen.getByText('Large Number')).toBeInTheDocument();
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });
});
