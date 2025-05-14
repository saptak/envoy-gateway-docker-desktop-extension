import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Chip,
  Menu,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Assignment as CollectionIcon,
  BugReport as TestIcon,
  CheckCircle as PassedIcon,
  Error as FailedIcon,
  Schedule as PendingIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { Routes, Route, useNavigate } from 'react-router-dom';

import { useTesting } from '@/hooks/useApi';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { setSelectedCollection, setSelectedRun } from '@/store/slices/testingSlice';
import { StatusBadge } from '@/components/common';
import { formatDateTime, formatDuration } from '@/utils';
import type { TestCollection, TestRun, TestCase } from '@/types';

const TestCollections: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { collections, refreshCollections, createCollection, runCollection } = useTesting();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newCollectionName, setNewCollectionName] = React.useState('');
  const [newCollectionDescription, setNewCollectionDescription] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedCollection, setSelected] = React.useState<TestCollection | null>(null);

  const handleCreateCollection = async () => {
    if (newCollectionName) {
      try {
        await createCollection({
          name: newCollectionName,
          description: newCollectionDescription,
          tests: [],
        });
        setCreateDialogOpen(false);
        setNewCollectionName('');
        setNewCollectionDescription('');
      } catch (error) {
        console.error('Failed to create collection:', error);
      }
    }
  };

  const handleRunCollection = async (collection: TestCollection) => {
    try {
      await runCollection(collection.id);
      navigate('/testing/runs');
    } catch (error) {
      console.error('Failed to run collection:', error);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, collection: TestCollection) => {
    setAnchorEl(event.currentTarget);
    setSelected(collection);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelected(null);
  };

  const handleEdit = () => {
    if (selectedCollection) {
      navigate(`/testing/collections/${selectedCollection.id}/edit`);
    }
    handleMenuClose();
  };

  const handleViewDetails = (collection: TestCollection) => {
    dispatch(setSelectedCollection(collection));
    navigate(`/testing/collections/${collection.id}`);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          Test Collections
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Collection
        </Button>
      </Box>

      <Grid container spacing={3}>
        {collections.map((collection) => (
          <Grid item xs={12} md={6} lg={4} key={collection.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {collection.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {collection.description}
                    </Typography>
                  </Box>
                  <IconButton onClick={(e) => handleMenuClick(e, collection)}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {collection.tests.length} test{collection.tests.length !== 1 ? 's' : ''}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {collection.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<RunIcon />}
                  onClick={() => handleRunCollection(collection)}
                >
                  Run Tests
                </Button>
                <Button
                  size="small"
                  onClick={() => handleViewDetails(collection)}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {collections.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CollectionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No test collections yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first test collection to get started with API testing
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Collection
          </Button>
        </Paper>
      )}

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
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Collection Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Test Collection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Collection Name"
            fullWidth
            variant="outlined"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newCollectionDescription}
            onChange={(e) => setNewCollectionDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCollection} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const TestRuns: React.FC = () => {
  const dispatch = useAppDispatch();
  const { testRuns, refreshRuns } = useTesting();
  const { isRunning, runProgress } = useAppSelector(state => state.testing);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <PassedIcon color="success" />;
      case 'failed':
        return <FailedIcon color="error" />;
      case 'running':
        return <PendingIcon color="primary" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (run: TestRun) => {
    if (run.status === 'running') return 'primary';
    if (run.summary.failed > 0) return 'error';
    return 'success';
  };

  const handleViewRun = (run: TestRun) => {
    dispatch(setSelectedRun(run));
  };

  React.useEffect(() => {
    refreshRuns();
  }, [refreshRuns]);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          Test Runs
        </Typography>
        {isRunning && (
          <Box sx={{ minWidth: 300 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                Running tests ({runProgress.current}/{runProgress.total})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {runProgress.percentage.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={runProgress.percentage}
            />
          </Box>
        )}
      </Box>

      <List>
        {testRuns.map((run) => (
          <ListItem
            key={run.id}
            sx={{
              mb: 1,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              cursor: 'pointer',
            }}
            onClick={() => handleViewRun(run)}
          >
            <ListItemIcon>
              {getStatusIcon(run.status)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">
                    Test Run #{run.id.slice(-8)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <StatusBadge status={run.status} />
                    <Chip
                      size="small"
                      label={`${run.summary.passed}/${run.summary.total}`}
                      color={getStatusColor(run)}
                    />
                  </Box>
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Started: {formatDateTime(run.timestamp)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {formatDuration(run.summary.duration)}
                  </Typography>
                  {run.summary.failed > 0 && (
                    <Typography variant="body2" color="error">
                      {run.summary.failed} failed, {run.summary.skipped} skipped
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {testRuns.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No test runs yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Run a test collection to see results here
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

const TestingMain: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
        Testing
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab icon={<CollectionIcon />} label="Collections" />
          <Tab icon={<HistoryIcon />} label="Test Runs" />
        </Tabs>
      </Paper>

      {activeTab === 0 && <TestCollections />}
      {activeTab === 1 && <TestRuns />}
    </Box>
  );
};

const Testing: React.FC = () => {
  return (
    <Routes>
      <Route path="/*" element={<TestingMain />} />
    </Routes>
  );
};

export default Testing;
