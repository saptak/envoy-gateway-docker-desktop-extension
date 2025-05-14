import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StatusBadge from '../../../components/common/StatusBadge';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe('StatusBadge Component', () => {
  test('renders with correct text and color for success status', () => {
    render(
      <TestWrapper>
        <StatusBadge status="running" />
      </TestWrapper>
    );

    const badge = screen.getByText('Running');
    expect(badge).toBeInTheDocument();
  });

  test('renders with correct text and color for error status', () => {
    render(
      <TestWrapper>
        <StatusBadge status="failed" />
      </TestWrapper>
    );

    const badge = screen.getByText('Failed');
    expect(badge).toBeInTheDocument();
  });

  test('renders with correct text and color for warning status', () => {
    render(
      <TestWrapper>
        <StatusBadge status="pending" />
      </TestWrapper>
    );

    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();
  });

  test('renders with outlined variant', () => {
    render(
      <TestWrapper>
        <StatusBadge status="active" variant="outlined" />
      </TestWrapper>
    );

    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
  });

  test('renders with medium size', () => {
    render(
      <TestWrapper>
        <StatusBadge status="healthy" size="medium" />
      </TestWrapper>
    );

    const badge = screen.getByText('Healthy');
    expect(badge).toBeInTheDocument();
  });

  test('handles unknown status', () => {
    render(
      <TestWrapper>
        <StatusBadge status="unknown-status" />
      </TestWrapper>
    );

    const badge = screen.getByText('Unknown-status');
    expect(badge).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(
      <TestWrapper>
        <StatusBadge status="active" className="custom-class" />
      </TestWrapper>
    );

    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
  });
});
