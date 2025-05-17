import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ApiClient } from '../services/apiClient';
import { useNotificationHelpers } from './NotificationSystem';

interface Listener {
  name: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'TLS';
  hostname?: string;
  allowedRoutes?: {
    namespaces?: {
      from: 'All' | 'Selector' | 'Same';
    };
  };
}

interface GatewayFormData {
  name: string;
  namespace: string;
  gatewayClassName: string;
  listeners: Listener[];
}

interface GatewayCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  namespaces: string[];
  editGateway?: any;
  apiClient: ApiClient;
}

export const GatewayCreateDialog: React.FC<GatewayCreateDialogProps> = ({
  open,
  onClose,
  onSuccess,
  namespaces,
  editGateway,
  apiClient
}) => {
  const [formData, setFormData] = useState<GatewayFormData>(() => ({
    name: editGateway?.name || '',
    namespace: editGateway?.namespace || 'default',
    gatewayClassName: editGateway?.gatewayClassName || 'envoy-gateway',
    listeners: editGateway?.listeners || [
      {
        name: 'http',
        port: 80,
        protocol: 'HTTP'
      }
    ]
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotificationHelpers();

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Gateway name is required';
    if (!formData.namespace) newErrors.namespace = 'Namespace is required';
    if (!formData.gatewayClassName) newErrors.gatewayClassName = 'Gateway class is required';
    if (formData.listeners.length === 0) newErrors.listeners = 'At least one listener is required';

    formData.listeners.forEach((listener, index) => {
      if (!listener.name) newErrors[`listener-${index}-name`] = 'Listener name is required';
      if (!listener.port || listener.port < 1 || listener.port > 65535) {
        newErrors[`listener-${index}-port`] = 'Valid port (1-65535) is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      if (editGateway) {
        await apiClient.updateGateway(editGateway.name, editGateway.namespace, formData);
        showSuccess(`Gateway '${formData.name}' updated successfully`);
      } else {
        await apiClient.createGateway(formData);
        showSuccess(`Gateway '${formData.name}' created successfully`);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message || 'Failed to save gateway', 'Gateway Operation Failed');
    } finally {
      setLoading(false);
    }
  };

  const addListener = () => {
    setFormData(prev => ({
      ...prev,
      listeners: [...prev.listeners, {
        name: `listener-${prev.listeners.length + 1}`,
        port: 8080,
        protocol: 'HTTP'
      }]
    }));
  };

  const updateListener = (index: number, field: keyof Listener, value: any) => {
    setFormData(prev => ({
      ...prev,
      listeners: prev.listeners.map((listener, i) => 
        i === index ? { ...listener, [field]: value } : listener
      )
    }));
  };

  const removeListener = (index: number) => {
    setFormData(prev => ({
      ...prev,
      listeners: prev.listeners.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      namespace: 'default',
      gatewayClassName: 'envoy-gateway',
      listeners: [{
        name: 'http',
        port: 80,
        protocol: 'HTTP'
      }]
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editGateway ? 'Edit Gateway' : 'Create Gateway'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Gateway Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={!!errors.name}
              helperText={errors.name}
              disabled={!!editGateway}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.namespace}>
              <InputLabel>Namespace</InputLabel>
              <Select
                value={formData.namespace}
                label="Namespace"
                onChange={(e) => setFormData(prev => ({ ...prev, namespace: e.target.value }))}
                disabled={!!editGateway}
              >
                {namespaces.map(ns => (
                  <MenuItem key={ns} value={ns}>{ns}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Gateway Class Name"
              value={formData.gatewayClassName}
              onChange={(e) => setFormData(prev => ({ ...prev, gatewayClassName: e.target.value }))}
              error={!!errors.gatewayClassName}
              helperText={errors.gatewayClassName || 'Usually "envoy-gateway" for Envoy Gateway'}
            />
          </Grid>

          {/* Listeners Section */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Listeners
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addListener}
                variant="outlined"
                size="small"
              >
                Add Listener
              </Button>
            </Box>
            {errors.listeners && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.listeners}
              </Alert>
            )}
          </Grid>

          {formData.listeners.map((listener, index) => (
            <Grid item xs={12} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">
                      Listener {index + 1}
                    </Typography>
                    {formData.listeners.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => removeListener(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Listener Name"
                        value={listener.name}
                        onChange={(e) => updateListener(index, 'name', e.target.value)}
                        error={!!errors[`listener-${index}-name`]}
                        helperText={errors[`listener-${index}-name`]}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Port"
                        type="number"
                        value={listener.port}
                        onChange={(e) => updateListener(index, 'port', parseInt(e.target.value))}
                        error={!!errors[`listener-${index}-port`]}
                        helperText={errors[`listener-${index}-port`]}
                        inputProps={{ min: 1, max: 65535 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Protocol</InputLabel>
                        <Select
                          value={listener.protocol}
                          label="Protocol"
                          onChange={(e) => updateListener(index, 'protocol', e.target.value)}
                        >
                          <MenuItem value="HTTP">HTTP</MenuItem>
                          <MenuItem value="HTTPS">HTTPS</MenuItem>
                          <MenuItem value="TCP">TCP</MenuItem>
                          <MenuItem value="TLS">TLS</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {(listener.protocol === 'HTTPS' || listener.protocol === 'TLS') && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Hostname (optional)"
                          value={listener.hostname || ''}
                          onChange={(e) => updateListener(index, 'hostname', e.target.value)}
                          helperText="Specific hostname for TLS SNI"
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Preview Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Gateway Preview
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip label={`Name: ${formData.name || 'unnamed'}`} />
              <Chip label={`Namespace: ${formData.namespace}`} />
              <Chip label={`Class: ${formData.gatewayClassName}`} />
              <Chip label={`Listeners: ${formData.listeners.length}`} />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : (editGateway ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
