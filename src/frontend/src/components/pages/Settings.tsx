import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Card,
  CardContent,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  BrightnessAuto as AutoIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Wifi as NetworkIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  RestoreFromTrash as ResetIcon,
} from '@mui/icons-material';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { setTheme } from '@/store/slices/uiSlice';
import { setMetricsConfig, setLogsConfig } from '@/store/slices/monitoringSlice';

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector(state => state.ui);
  const { metricsConfig, logsConfig } = useAppSelector(state => state.monitoring);

  const [localSettings, setLocalSettings] = React.useState({
    apiTimeout: 10000,
    retryAttempts: 3,
    enableNotifications: true,
    soundEnabled: false,
    autoCleanupLogs: true,
    maxLogEntries: 1000,
    enableTelemetry: false,
    compactMode: false,
  });

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    dispatch(setTheme(newTheme));
  };

  const handleMetricsConfigChange = (key: string, value: any) => {
    dispatch(setMetricsConfig({ [key]: value }));
  };

  const handleLogsConfigChange = (key: string, value: any) => {
    dispatch(setLogsConfig({ [key]: value }));
  };

  const handleLocalSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    // Save settings to localStorage or API
    localStorage.setItem('envoyGatewaySettings', JSON.stringify(localSettings));
    // Show success notification
  };

  const handleResetSettings = () => {
    // Reset to default settings
    setLocalSettings({
      apiTimeout: 10000,
      retryAttempts: 3,
      enableNotifications: true,
      soundEnabled: false,
      autoCleanupLogs: true,
      maxLogEntries: 1000,
      enableTelemetry: false,
      compactMode: false,
    });
    dispatch(setTheme('auto'));
    dispatch(setMetricsConfig({
      refreshInterval: 5000,
      historyDuration: '1h',
      autoRefresh: true,
    }));
    dispatch(setLogsConfig({
      maxLines: 1000,
      autoScroll: true,
      realTime: true,
    }));
  };

  React.useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem('envoyGatewaySettings');
    if (stored) {
      setLocalSettings(JSON.parse(stored));
    }
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Appearance Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 1 }} />
                Appearance
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Theme"
                    secondary="Choose your preferred color scheme"
                  />
                  <FormControl size="small">
                    <Select
                      value={theme}
                      onChange={(e) => handleThemeChange(e.target.value as any)}
                    >
                      <MenuItem value="light">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LightIcon sx={{ mr: 1 }} />
                          Light
                        </Box>
                      </MenuItem>
                      <MenuItem value="dark">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DarkIcon sx={{ mr: 1 }} />
                          Dark
                        </Box>
                      </MenuItem>
                      <MenuItem value="auto">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AutoIcon sx={{ mr: 1 }} />
                          Auto
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Compact Mode"
                    secondary="Use smaller spacing and components"
                  />
                  <Switch
                    checked={localSettings.compactMode}
                    onChange={(e) => handleLocalSettingChange('compactMode', e.target.checked)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationIcon sx={{ mr: 1 }} />
                Notifications
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Enable Notifications"
                    secondary="Receive system and error notifications"
                  />
                  <Switch
                    checked={localSettings.enableNotifications}
                    onChange={(e) => handleLocalSettingChange('enableNotifications', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Sound Alerts"
                    secondary="Play sound for important notifications"
                  />
                  <Switch
                    checked={localSettings.soundEnabled}
                    onChange={(e) => handleLocalSettingChange('soundEnabled', e.target.checked)}
                    disabled={!localSettings.enableNotifications}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Monitoring Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <RefreshIcon sx={{ mr: 1 }} />
                Monitoring
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Auto Refresh Metrics"
                    secondary="Automatically update metrics dashboard"
                  />
                  <Switch
                    checked={metricsConfig.autoRefresh}
                    onChange={(e) => handleMetricsConfigChange('autoRefresh', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Refresh Interval (seconds)" />
                  <TextField
                    size="small"
                    type="number"
                    value={metricsConfig.refreshInterval / 1000}
                    onChange={(e) => handleMetricsConfigChange('refreshInterval', parseInt(e.target.value) * 1000)}
                    sx={{ width: 80 }}
                    disabled={!metricsConfig.autoRefresh}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Auto Scroll Logs"
                    secondary="Automatically scroll to new log entries"
                  />
                  <Switch
                    checked={logsConfig.autoScroll}
                    onChange={(e) => handleLogsConfigChange('autoScroll', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Max Log Entries" />
                  <TextField
                    size="small"
                    type="number"
                    value={logsConfig.maxLines}
                    onChange={(e) => handleLogsConfigChange('maxLines', parseInt(e.target.value))}
                    sx={{ width: 100 }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Network Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <NetworkIcon sx={{ mr: 1 }} />
                Network
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="API Timeout (ms)" />
                  <TextField
                    size="small"
                    type="number"
                    value={localSettings.apiTimeout}
                    onChange={(e) => handleLocalSettingChange('apiTimeout', parseInt(e.target.value))}
                    sx={{ width: 100 }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Retry Attempts" />
                  <TextField
                    size="small"
                    type="number"
                    value={localSettings.retryAttempts}
                    onChange={(e) => handleLocalSettingChange('retryAttempts', parseInt(e.target.value))}
                    sx={{ width: 80 }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Storage Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <StorageIcon sx={{ mr: 1 }} />
                Storage & Privacy
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Auto-cleanup Logs"
                    secondary="Automatically remove old log entries"
                  />
                  <Switch
                    checked={localSettings.autoCleanupLogs}
                    onChange={(e) => handleLocalSettingChange('autoCleanupLogs', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Enable Telemetry"
                    secondary="Help improve the extension by sharing usage data"
                  />
                  <Switch
                    checked={localSettings.enableTelemetry}
                    onChange={(e) => handleLocalSettingChange('enableTelemetry', e.target.checked)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 1 }} />
                Security
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Security Warnings"
                    secondary="Show warnings for insecure configurations"
                  />
                  <Switch
                    checked={true}
                    disabled
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Auto-logout"
                    secondary="Automatically logout after inactivity (if authentication is enabled)"
                  />
                  <Switch
                    checked={false}
                    disabled
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* About */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About Envoy Gateway Extension
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Version: 1.0.0-alpha
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Build: {process.env.REACT_APP_BUILD_VERSION || 'development'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Built with React {React.version}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" paragraph>
                    This extension provides a user-friendly interface for managing Envoy Gateway
                    configurations, monitoring traffic, and testing API routes.
                  </Typography>
                  <Button
                    variant="outlined"
                    href="https://github.com/saptak/envoy-gateway-docker-desktop-extension"
                    target="_blank"
                    rel="noopener"
                  >
                    View on GitHub
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<ResetIcon />}
              onClick={handleResetSettings}
            >
              Reset to Defaults
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
