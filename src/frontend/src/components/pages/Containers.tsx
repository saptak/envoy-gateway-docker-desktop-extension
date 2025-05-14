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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Container as ContainerIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Assignment as LogsIcon,
} from '@mui/icons-material';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';

import { useContainers } from '@/hooks/useApi';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { setFilters, setSorting } from '@/store/slices/containerSlice';
import { StatusBadge, LogViewer } from '@/components/common';
import { formatDateTime, formatBytes } from '@/utils';
import type { DockerContainer } from '@/types';

const ContainerList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { containers, allContainers, loading, error, refresh, start, stop, remove, getLogs } = useContainers();
  const { filters, sortBy, sortOrder, logs } = useAppSelector(state => state.containers);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedContainer, setSelectedContainer] = React.useState<DockerContainer | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState(filters.search);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, container: DockerContainer) => {
    setAnchorEl(event.currentTarget);
    setSelectedContainer(container);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContainer(null);
  };

  const handleContainerAction = async (action: 'start' | 'stop' | 'delete', container: DockerContainer) => {
    setActionLoading(container.id);
    try {
      switch (action) {
        case 'start':
          await start(container.id);
          break;
        case 'stop':
          await stop(container.id);
          break;
        case 'delete':
          await remove(container.id);
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
    } finally {
      setActionLoading(null);
      handleMenuClose();
    }
  };

  const handleViewLogs = (container: DockerContainer) => {
    navigate(`/containers/${container.id}/logs`);
    handleMenuClose();
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

  const getStatusChip = (state: string) => {
    const colorMap: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
      running: 'success',
      exited: 'error',
      created: 'warning',
      restarting: 'warning',
      paused: 'warning',
      removing: 'error',
      dead: 'error',
    };
    return <StatusBadge status={state} />;
  };

  const uniqueImages = [...new Set(allContainers.map(c => c.image.split(':')[0]))];
  const uniqueStates = [...new Set(allContainers.map(c => c.state))];

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
          Containers
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
            startIcon={<ContainerIcon />}
            onClick={() => navigate('/containers/create')}
          >
            Deploy Container
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search containers"
              value={searchText}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Image</InputLabel>
              <Select
                value={filters.image}
                label="Image"
                onChange={(e) => handleFilterChange('image', e.target.value)}
              >
                <MenuItem value="">All Images</MenuItem>
                {uniqueImages.map(image => (
                  <MenuItem key={image} value={image}>{image}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>State</InputLabel>
              <Select
                value={filters.state}
                label="State"
                onChange={(e) => handleFilterChange('state', e.target.value)}
              >
                <MenuItem value="">All States</MenuItem>
                {uniqueStates.map(state => (
                  <MenuItem key={state} value={state}>{state}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Containers Table */}
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
                  onClick={() => handleSortChange('image')}
                  sx={{ fontWeight: 600 }}
                >
                  Image {sortBy === 'image' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleSortChange('state')}
                  sx={{ fontWeight: 600 }}
                >
                  Status {sortBy === 'state' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableCell>
              <TableCell>Ports</TableCell>
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
            {containers.map((container) => (
              <TableRow key={container.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.main' }}>
                      <ContainerIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {container.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {container.id.substring(0, 12)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {container.image.split('/').pop()?.split(':')[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {container.image.split(':')[1] || 'latest'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {getStatusChip(container.state)}
                </TableCell>
                <TableCell>
                  {container.ports.length > 0 ? (
                    container.ports.map((port, index) => (
                      <Chip
                        key={index}
                        label={port.publicPort ? `${port.publicPort}:${port.privatePort}` : port.privatePort}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No exposed ports
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(new Date(container.created * 1000).toISOString())}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {container.state === 'running' ? (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleContainerAction('stop', container)}
                        disabled={actionLoading === container.id}
                      >
                        <StopIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleContainerAction('start', container)}
                        disabled={actionLoading === container.id}
                      >
                        <StartIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, container)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {containers.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {loading ? 'Loading containers...' : 'No containers found'}
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
        <MenuItem onClick={() => handleViewLogs(selectedContainer!)}>
          <LogsIcon sx={{ mr: 1 }} />
          View Logs
        </MenuItem>
        <MenuItem onClick={() => selectedContainer && handleContainerAction('delete', selectedContainer)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

const ContainerLogs: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { containers, getLogs } = useContainers();
  const { logs } = useAppSelector(state => state.containers);
  const [activeTab, setActiveTab] = React.useState(0);

  const container = containers.find(c => c.id === id);
  const containerLogs = logs[id!] || [];

  React.useEffect(() => {
    if (id) {
      getLogs(id, 100);
    }
  }, [id, getLogs]);

  const handleRefreshLogs = () => {
    if (id) {
      getLogs(id, 100);
    }
  };

  // Convert log strings to LogEntry format
  const logEntries = containerLogs.map((logLine, index) => ({
    id: `${id}-${index}`,
    timestamp: new Date().toISOString(),
    level: 'info' as const,
    component: 'container',
    message: logLine,
  }));

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          Container: {container?.name || id}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/containers')}
          >
            Back to List
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshLogs}
          >
            Refresh Logs
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="Logs" />
          <Tab label="Details" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <LogViewer
          logs={logEntries}
          maxHeight={600}
          showTimestamp={false}
          showComponent={false}
        />
      )}

      {activeTab === 1 && container && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Container Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemText primary="ID" secondary={container.id} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Name" secondary={container.name} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Image" secondary={container.image} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="State" secondary={container.state} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Status" secondary={container.status} />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Port Mappings
              </Typography>
              {container.ports.map((port, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    {port.ip || '0.0.0.0'}:{port.publicPort || 'N/A'} → {port.privatePort} ({port.type})
                  </Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

const ContainerCreate: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Deploy Container
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Container deployment form would go here</Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/containers')}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button variant="contained">
            Deploy
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

const Containers: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ContainerList />} />
      <Route path="/create" element={<ContainerCreate />} />
      <Route path="/:id/logs" element={<ContainerLogs />} />
    </Routes>
  );
};

export default Containers;
