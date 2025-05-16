import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  SelectChangeEvent,
  CircularProgress,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewListIcon from '@mui/icons-material/ViewList';

interface Namespace {
  name: string;
  status: string;
  createdAt: Date | string;
}

interface NamespaceSelectorProps {
  namespaces: Namespace[];
  selectedNamespace: string;
  onNamespaceChange: (namespace: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const NamespaceSelector: React.FC<NamespaceSelectorProps> = ({
  namespaces,
  selectedNamespace,
  onNamespaceChange,
  onRefresh,
  loading
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onNamespaceChange(event.target.value);
  };

  const getNamespaceDisplayText = () => {
    if (!selectedNamespace || selectedNamespace === '') {
      return 'All Namespaces';
    }
    return selectedNamespace;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <ViewListIcon color="primary" />
            <Typography variant="h6">
              Namespace Filter
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            onClick={onRefresh}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            size="small"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel id="namespace-select-label">Namespace</InputLabel>
            <Select
              labelId="namespace-select-label"
              value={selectedNamespace}
              label="Namespace"
              onChange={handleChange}
              disabled={loading}
            >
              <MenuItem value="">
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip label="ALL" size="small" variant="outlined" />
                  All Namespaces
                </Box>
              </MenuItem>
              {namespaces.map((ns) => (
                <MenuItem key={ns.name} value={ns.name}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip 
                      label={ns.status} 
                      size="small" 
                      color={ns.status === 'Active' ? 'success' : 'default'}
                    />
                    {ns.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Showing resources in:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getNamespaceDisplayText()}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NamespaceSelector;
