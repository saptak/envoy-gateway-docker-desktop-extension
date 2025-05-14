import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Timeline as MetricsIcon,
  Assignment as LogsIcon,
  Speed as PerformanceIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Routes, Route } from 'react-router-dom';

import { useMonitoring } from '@/hooks/useApi';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { setFilters, setMetricsConfig, setLogsConfig } from '@/store/slices/monitoringSlice';
import { MetricCard, LogViewer } from '@/components/common';
import { formatNumber, formatBytes, formatDuration, formatPercentage } from '@/utils';

const MetricsDashboard: React.FC = () => {
  const { currentMetrics, metricsHistory, refreshMetrics, getMetricsHistory } = useMonitoring();
  const { metricsConfig } = useAppSelector(state => state.monitoring);
  const dispatch = useAppDispatch();

  const [timeRange, setTimeRange] = React.useState('1h');

  React.useEffect(() => {
    getMetricsHistory(timeRange);
  }, [timeRange, getMetricsHistory]);

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    getMetricsHistory(range);
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    dispatch(setMetricsConfig({ autoRefresh: enabled }));
  };

  const handleRefreshIntervalChange = (interval: number) => {
    dispatch(setMetricsConfig({ refreshInterval: interval }));
  };

  // Prepare chart data
  const trafficData = metricsHistory.map(metric => ({
    timestamp: new Date(metric.timestamp).toLocaleTimeString(),
    requests: metric.traffic.requestRate,
    errors: metric.traffic.errorRate * metric.traffic.requestRate / 100,
    p50: metric.traffic.p50Latency,
    p95: metric.traffic.p95Latency,
    p99: metric.traffic.p99Latency,
  }));

  const resourceData = metricsHistory.map(metric => ({
    timestamp: new Date(metric.timestamp).toLocaleTimeString(),
    cpuUsage: (metric.resources.cpu.usage / metric.resources.cpu.limit) * 100,
    memoryUsage: (metric.resources.memory.usage / metric.resources.memory.limit) * 100,
  }));

  const gatewayStatusData = currentMetrics ? [
    { name: 'Healthy', value: currentMetrics.gateways.healthy, color: '#4caf50' },
    { name: 'Unhealthy', value: currentMetrics.gateways.unhealthy, color: '#f44336' },
  ] : [];

  const routeStatusData = currentMetrics ? [
    { name: 'Attached', value: currentMetrics.routes.attached, color: '#2196f3' },
    { name: 'Detached', value: currentMetrics.routes.detached, color: '#ff9800' },
  ] : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          Metrics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => handleTimeRangeChange(e.target.value)}
            >
              <MenuItem value="5m">5 minutes</MenuItem>
              <MenuItem value="15m">15 minutes</MenuItem>
              <MenuItem value="1h">1 hour</MenuItem>
              <MenuItem value="6h">6 hours</MenuItem>
              <MenuItem value="24h">24 hours</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={metricsConfig.autoRefresh}
                onChange={(e) => handleAutoRefreshToggle(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshMetrics}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Request Rate"
            value={currentMetrics?.traffic.requestRate || 0}
            unit="req/s"
            color="primary"
            trend={trafficData.map(d => d.requests)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Error Rate"
            value={formatPercentage(currentMetrics?.traffic.errorRate || 0)}
            color="error"
            trend={trafficData.map(d => d.errors)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="P95 Latency"
            value={formatDuration(currentMetrics?.traffic.p95Latency || 0)}
            color="warning"
            trend={trafficData.map(d => d.p95)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Gateways"
            value={currentMetrics?.gateways.healthy || 0}
            unit={`of ${currentMetrics?.gateways.total || 0}`}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Traffic Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Traffic Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#2196f3"
                  strokeWidth={2}
                  name="Requests/sec"
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#f44336"
                  strokeWidth={2}
                  name="Errors/sec"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gateway Status */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gateway Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gatewayStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {gatewayStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Latency Distribution */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Latency Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="p50"
                  stackId="1"
                  stroke="#4caf50"
                  fill="#4caf50"
                  fillOpacity={0.6}
                  name="P50"
                />
                <Area
                  type="monotone"
                  dataKey="p95"
                  stackId="2"
                  stroke="#ff9800"
                  fill="#ff9800"
                  fillOpacity={0.6}
                  name="P95"
                />
                <Area
                  type="monotone"
                  dataKey="p99"
                  stackId="3"
                  stroke="#f44336"
                  fill="#f44336"
                  fillOpacity={0.6}
                  name="P99"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Resource Usage */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resource Usage
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resourceData.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="cpuUsage" fill="#2196f3" name="CPU %" />
                <Bar dataKey="memoryUsage" fill="#4caf50" name="Memory %" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const LogsDashboard: React.FC = () => {
  const { logs, refreshLogs } = useMonitoring();
  const { filters, logsConfig } = useAppSelector(state => state.monitoring);
  const dispatch = useAppDispatch();

  const [component, setComponent] = React.useState(filters.component);
  const [level, setLevel] = React.useState(filters.level);

  const handleFilterChange = () => {
    dispatch(setFilters({ component, level }));
    refreshLogs(component, level, logsConfig.maxLines);
  };

  const handleConfigChange = (key: string, value: any) => {
    dispatch(setLogsConfig({ [key]: value }));
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          System Logs
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleFilterChange}
        >
          Refresh Logs
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Component</InputLabel>
              <Select
                value={component}
                label="Component"
                onChange={(e) => setComponent(e.target.value)}
              >
                <MenuItem value="">All Components</MenuItem>
                <MenuItem value="gateway">Gateway</MenuItem>
                <MenuItem value="proxy">Proxy</MenuItem>
                <MenuItem value="controller">Controller</MenuItem>
                <MenuItem value="webhook">Webhook</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={level}
                label="Level"
                onChange={(e) => setLevel(e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              onClick={handleFilterChange}
              fullWidth
            >
              Apply Filters
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={logsConfig.autoScroll}
                    onChange={(e) => handleConfigChange('autoScroll', e.target.checked)}
                  />
                }
                label="Auto Scroll"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={logsConfig.realTime}
                    onChange={(e) => handleConfigChange('realTime', e.target.checked)}
                  />
                }
                label="Real Time"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Logs Viewer */}
      <LogViewer
        logs={logs}
        maxHeight={600}
        autoScroll={logsConfig.autoScroll}
        showTimestamp={true}
        showComponent={true}
      />
    </Box>
  );
};

const MonitoringMain: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
        Monitoring
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab icon={<MetricsIcon />} label="Metrics" />
          <Tab icon={<LogsIcon />} label="Logs" />
        </Tabs>
      </Paper>

      {activeTab === 0 && <MetricsDashboard />}
      {activeTab === 1 && <LogsDashboard />}
    </Box>
  );
};

const Monitoring: React.FC = () => {
  return (
    <Routes>
      <Route path="/*" element={<MonitoringMain />} />
    </Routes>
  );
};

export default Monitoring;
