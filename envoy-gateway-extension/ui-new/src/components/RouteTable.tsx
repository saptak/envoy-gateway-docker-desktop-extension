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
import RouteIcon from '@mui/icons-material/Route';

interface Route {
  name: string;
  namespace: string;
  status: string;
  hostnames?: string[];
  rules?: Array<{
    path: string;
  }>;
  createdAt: Date | string;
}

interface RouteTableProps {
  routes: Route[];
  selectedNamespace: string;
}

export const RouteTable: React.FC<RouteTableProps> = ({
  routes,
  selectedNamespace
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'ready':
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
          <RouteIcon color="primary" />
          <Typography variant="h6">
            Routes
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
                <TableCell>Hostnames</TableCell>
                <TableCell>Rules</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={`${route.namespace}-${route.name}`} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {route.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={route.namespace} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={route.status} 
                      color={getStatusColor(route.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {route.hostnames && route.hostnames.length > 0 ? (
                        route.hostnames.map((hostname, index) => (
                          <Typography key={index} variant="body2" component="div">
                            {hostname}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No hostnames
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {route.rules?.length || 0} rules
                      </Typography>
                      {route.rules?.slice(0, 2).map((rule, index) => (
                        <Typography key={index} variant="caption" display="block" color="text.secondary">
                          {rule.path}
                        </Typography>
                      ))}
                      {(route.rules?.length || 0) > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          ... and {(route.rules?.length || 0) - 2} more
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(route.createdAt)}
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
              {routes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box py={3}>
                      <Typography color="text.secondary">
                        No routes found
                        {selectedNamespace ? ` in namespace "${selectedNamespace}"` : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Create routes to define traffic routing rules
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

export default RouteTable;
