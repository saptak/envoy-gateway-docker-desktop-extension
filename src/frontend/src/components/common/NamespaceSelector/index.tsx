import React, { useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Public as GlobeIcon,
  ExpandMore as ChevronDownIcon,
} from '@mui/icons-material';

interface NamespaceInfo {
  name: string;
  gatewayCount: number;
  routeCount: number;
  totalResources: number;
  error?: string;
}

interface NamespaceSelectorProps {
  selectedNamespace: string;
  onNamespaceChange: (namespace: string) => void;
  showAllNamespaces: boolean;
  onToggleAllNamespaces: () => void;
  namespaces: NamespaceInfo[];
  namespaceCounts?: Record<string, number>;
  loading?: boolean;
  className?: string;
  placeholder?: string;
}

const NamespaceSelector: React.FC<NamespaceSelectorProps> = ({
  selectedNamespace,
  onNamespaceChange,
  showAllNamespaces,
  onToggleAllNamespaces,
  namespaces,
  namespaceCounts = {},
  loading = false,
  className = '',
  placeholder = 'Select namespace...',
}) => {
  const handleChange = (event: any) => {
    const value = event.target.value;
    if (value === 'all') {
      onToggleAllNamespaces();
    } else {
      onNamespaceChange(value);
    }
  };

  const filteredNamespaces = namespaces.filter(ns => ns.totalResources > 0);

  const getDisplayValue = () => {
    if (showAllNamespaces) {
      return 'all';
    }
    return selectedNamespace || '';
  };

  const getTotalResourceCount = () => {
    return Object.values(namespaceCounts).reduce((sum, count) => sum + count, 0);
  };

  return (
    <FormControl fullWidth className={className} size="small">
      <InputLabel id="namespace-selector-label">Namespace</InputLabel>
      <Select
        labelId="namespace-selector-label"
        value={getDisplayValue()}
        onChange={handleChange}
        label="Namespace"
        disabled={loading}
        renderValue={(value) => {
          if (value === 'all') {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GlobeIcon fontSize="small" color="primary" />
                <Typography variant="body2">All Namespaces</Typography>
                <Chip 
                  label={getTotalResourceCount()}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            );
          }
          const count = namespaceCounts[value as string];
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{value}</Typography>
              {count !== undefined && (
                <Chip 
                  label={count}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          );
        }}
        IconComponent={loading ? () => <CircularProgress size={16} /> : ChevronDownIcon}
      >
        {/* All Namespaces Option */}
        <MenuItem value="all">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <GlobeIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>All Namespaces</Typography>
            <Chip 
              label={getTotalResourceCount()}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </MenuItem>

        {/* Individual Namespaces */}
        {filteredNamespaces.length > 0 ? (
          filteredNamespaces.map((namespace) => (
            <MenuItem key={namespace.name} value={namespace.name}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="body2">{namespace.name}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {namespace.gatewayCount > 0 && (
                    <Chip 
                      label={`${namespace.gatewayCount} gw`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {namespace.routeCount > 0 && (
                    <Chip 
                      label={`${namespace.routeCount} rt`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">
              No namespaces with resources found
            </Typography>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

export default NamespaceSelector;
