import React from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  useTheme,
} from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  trend?: number[];
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  change,
  trend,
  color = 'primary',
  loading = false,
  onClick,
}) => {
  const theme = useTheme();

  const getColorValue = () => {
    switch (color) {
      case 'primary': return theme.palette.primary.main;
      case 'secondary': return theme.palette.secondary.main;
      case 'success': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      case 'info': return theme.palette.info.main;
      default: return theme.palette.primary.main;
    }
  };

  const colorValue = getColorValue();

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const getChangeColor = () => {
    if (!change) return 'inherit';
    return change.type === 'increase' 
      ? theme.palette.success.main 
      : theme.palette.error.main;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          elevation: 4,
          transform: 'translateY(-2px)',
        } : {},
      }}
      onClick={onClick}
    >
      {loading && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            borderRadius: '12px 12px 0 0',
          }}
        />
      )}

      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: colorValue,
            mr: 1,
          }}
        >
          {formatValue(value)}
        </Typography>
        {unit && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            {unit}
          </Typography>
        )}
      </Box>

      {change && (
        <Typography
          variant="caption"
          sx={{
            color: getChangeColor(),
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {change.type === 'increase' ? '↑' : '↓'} {Math.abs(change.value)}% {change.period}
        </Typography>
      )}

      {trend && trend.length > 0 && (
        <Box sx={{ mt: 2, height: 40 }}>
          <svg width="100%" height="40" viewBox="0 0 100 40">
            <polyline
              fill="none"
              stroke={colorValue}
              strokeWidth="2"
              points={trend.map((point, index) => 
                `${(index / (trend.length - 1)) * 100},${40 - (point / Math.max(...trend)) * 30}`
              ).join(' ')}
            />
          </svg>
        </Box>
      )}
    </Paper>
  );
};

export default MetricCard;
