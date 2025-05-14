import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Route as RouteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { Routes, Route, useNavigate } from 'react-router-dom';

import { useRoutes } from '@/hooks/useApi';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { setFilters, setSorting } from '@/store/slices/routeSlice';
import { StatusBadge } from '@/components/common';
import { formatDateTime } from '@/utils';
import type { HTTPRoute } from '@/types';

const RouteList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { routes, allRoutes, loading, error, refresh, remove } = useRoutes();
  const { filters, sortBy, sortOrder } = useAppSelector(state => state.routes);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRoute, setSelectedRoute] = React.useState<HTTPRoute | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState(filters.search);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, route: HTTPRoute) => {
    setAnchorEl(event.currentTarget);
    setSelectedRoute(route);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRoute(null);
  };

  const handleEdit = () => {
    if (selectedRoute) {
      navigate(`/routes/${selectedRoute.namespace}/${selectedRoute.name}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedRoute) {
      try {
        await remove(selectedRoute.namespace, selectedRoute.name);
        setDeleteDialogOpen(false);
        setSelectedRoute(null);
      } catch (error) {
        console.error('Failed to delete route:', error);
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleSortChange = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch(setSorting({ sortBy: field as any, sortOrder: newOrder }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchText(value);
    dispatch(setFilters({ search: value }));
  };

  const getRouteStatus = (route: HTTPRoute) => {
    const attachedParents = route.status.parents.filter(p => 
      p.conditions.some(c => c.type === 'Accepted' && c.status === 'True')
    );
    return attachedParents.length > 0 ? 'attached' : 'detached';
  };

  const uniqueNamespaces = [...new Set(allRoutes.map(r => r.namespace))];
  const uniqueGateways = [...new Set(allRoutes.flatMap(r => r.parentRefs.map(ref => ref.name)))];

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body1">{error}</Typography>
        <Button onClick={refresh} variant="outlined" sx={{ mt: 1 }}>
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>
          HTTP Routes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/routes/create')}
          >
            Create Route
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search routes"
              value={searchText}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Namespace</InputLabel>
              <Select
                value={filters.namespace}
                label="Namespace"
                onChange={(e) => handleFilterChange('namespace', e.target.value)}
              >
                <MenuItem value="">All Namespaces</MenuItem>
                {uniqueNamespaces.map(ns => (
                  <MenuItem key={ns} value={ns}>{ns}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Gateway</InputLabel>
              <Select
                value={filters.gateway}
                label="Gateway"
                onChange={(e) => handleFilterChange('gateway', e.target.value)}
              >
                <MenuItem value="">All Gateways</MenuItem>
                {uniqueGateways.map(gw => (
                  <MenuItem key={gw} value={gw}>{gw}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="attached">Attached</MenuItem>
                <MenuItem value="detached">Detached</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Routes Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Button
                  onClick={() => handleSortChange('name')}
                  sx={{ fontWeight: 600 }}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleSortChange('namespace')}
                  sx={{ fontWeight: 600 }}
                >
                  Namespace {sortBy === 'namespace' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleSortChange('gateway')}
                  sx={{ fontWeight: 600 }}
                >
                  Gateway {sortBy === 'gateway' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableCell>
              <TableCell>Hostnames</TableCell>
              <TableCell>Rules</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>
                <Button
                  onClick={() => handleSortChange('created')}
                  sx={{ fontWeight: 600 }}
                >
                  Created {sortBy === 'created' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {routes.map((route) => {
              const status = getRouteStatus(route);
              return (
                <TableRow key={`${route.namespace}/${route.name}`}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                        <RouteIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {route.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {route.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={route.namespace} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {route.parentRefs.map((ref, index) => (
                      <Chip
                        key={index}
                        label={ref.name}
                        size="small"
                        sx={{ mr: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    {route.hostnames ? (
                      route.hostnames.map((hostname, index) => (
                        <Typography key={index} variant="body2">
                          {hostname}
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Any
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {route.rules.length} rule{route.rules.length !== 1 ? 's' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDateTime(route.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => handleMenuClick(e, route)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {routes.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {loading ? 'Loading routes...' : 'No routes found'}
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Route</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the route "{selectedRoute?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const RouteCreate: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Create HTTP Route
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Route creation form would go here</Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/routes')}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button variant="contained">
            Create
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

const RouteDetail: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Route Details
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Route details would go here</Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/routes')}
          >
            Back to List
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

const HTTPRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RouteList />} />
      <Route path="/create" element={<RouteCreate />} />
      <Route path="/:namespace/:name" element={<RouteDetail />} />
      <Route path="/:namespace/:name/edit" element={<RouteCreate />} />
    </Routes>
  );
};

export default HTTPRoutes;
