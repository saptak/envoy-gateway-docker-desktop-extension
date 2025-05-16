import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RouterIcon from '@mui/icons-material/Router';

interface Gateway {
  name: string;
  namespace: string;
  status: string;
  gatewayClassName: string;
  listeners?: Array<{
    name: string;
    port: number;
    protocol: string;
  }>;
  createdAt: Date | string;
}

interface GatewayTableProps {
  gateways: Gateway[];
  selectedNamespace: string;
}

export const GatewayTable: React.FC<GatewayTableProps> = ({
  gateways,
  selectedNamespace
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
      case 'accepted':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'error';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <RouterIcon color="primary" />
          <Typography variant="h6">
            Gateways
          </Typography>
          {selectedNamespace && (
            <Chip 
              label={`in ${selectedNamespace}`} 
              size="small" 
              variant="outlined" 
            />
          )}
        </Box>
        
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Namespace</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Gateway Class</TableCell>
                <TableCell>Listeners</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gateways.map((gateway) => (
                <TableRow key={`${gateway.namespace}-${gateway.name}`} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {gateway.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={gateway.namespace} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={gateway.status} 
                      color={getStatusColor(gateway.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {gateway.gatewayClassName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {gateway.listeners?.length || 0} listeners
                      </Typography>
                      {gateway.listeners?.map((listener, index) => (
                        <Typography key={index} variant="caption" display="block" color="text.secondary">
                          {listener.name}: {listener.port}/{listener.protocol}
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(gateway.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {gateways.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box py={3}>
                      <Typography color="text.secondary">
                        No gateways found
                        {selectedNamespace ? ` in namespace "${selectedNamespace}"` : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Create a gateway to manage traffic routing
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default GatewayTable;
