import React from 'react';
import { Card, CardContent, Typography, Box, Tooltip, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const CardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  paddingBottom: 0,
}));

const CardTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontWeight: 500,
  color: theme.palette.text.secondary,
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '2rem',
  lineHeight: 1.2,
  marginBottom: theme.spacing(1),
}));

const TrendIndicator = styled(Box)(({ theme, trend }: { theme: any; trend: 'up' | 'down' | 'neutral' }) => ({
  display: 'flex',
  alignItems: 'center',
  color:
    trend === 'up'
      ? theme.palette.success.main
      : trend === 'down'
      ? theme.palette.error.main
      : theme.palette.text.secondary,
  fontSize: '0.875rem',
}));

export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number | string;
  loading?: boolean;
  tooltip?: string;
  icon?: React.ReactNode;
  color?: string;
  onClick?: () => void;
  testId?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  trend = 'neutral',
  trendValue,
  loading = false,
  tooltip,
  icon,
  color,
  onClick,
  testId = 'metric-card',
}) => {
  return (
    <StyledCard 
      onClick={onClick} 
      sx={{ cursor: onClick ? 'pointer' : 'default' }}
      data-testid={testId}
    >
      <CardHeader>
        <CardTitle variant="subtitle2" color="textSecondary">
          {icon}
          {title}
          {tooltip && (
            <Tooltip title={tooltip} arrow>
              <InfoOutlinedIcon fontSize="small" color="action" />
            </Tooltip>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <MetricValue variant="h4" color={color || 'textPrimary'} data-testid={`${testId}-value`}>
              {value}
              {unit && <Typography component="span" variant="body2" color="textSecondary"> {unit}</Typography>}
            </MetricValue>
            {trendValue && (
              <TrendIndicator trend={trend} data-testid={`${testId}-trend`}>
                {trend === 'up' ? (
                  <TrendingUpIcon fontSize="small" />
                ) : trend === 'down' ? (
                  <TrendingDownIcon fontSize="small" />
                ) : null}
                <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                  {trendValue}
                </Typography>
              </TrendIndicator>
            )}
          </>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default MetricCard;
