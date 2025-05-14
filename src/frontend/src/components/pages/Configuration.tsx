import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Code as CodeIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as ValidateIcon,
  PlayArrow as ApplyIcon,
} from '@mui/icons-material';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import { Routes, Route } from 'react-router-dom';

import { apiService } from '@/services/api';
import { useAppSelector } from '@/hooks/redux';

const ConfigurationEditor: React.FC = () => {
  const { theme } = useAppSelector(state => state.ui);
  const [content, setContent] = React.useState('');
  const [contentType, setContentType] = React.useState<'yaml' | 'json'>('yaml');
  const [validationResult, setValidationResult] = React.useState<{ valid: boolean; errors?: string[] } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const defaultGatewayYaml = `apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: example-gateway
  namespace: default
spec:
  gatewayClassName: example-gateway-class
  listeners:
  - name: http
    port: 80
    protocol: HTTP
  - name: https
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      certificateRefs:
      - name: example-tls-cert`;

  const defaultRouteYaml = `apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: example-route
  namespace: default
spec:
  parentRefs:
  - name: example-gateway
  hostnames:
  - example.com
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: api-service
      port: 8080`;

  React.useEffect(() => {
    if (!content) {
      setContent(defaultGatewayYaml);
    }
  }, [content]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setValidationResult(null);
  };

  const handleTypeChange = async (newType: 'yaml' | 'json') => {
    if (content && contentType !== newType) {
      setLoading(true);
      try {
        if (newType === 'json') {
          const result = await apiService.convertYamlToJson(content);
          setContent(JSON.stringify(result, null, 2));
        } else {
          const parsed = JSON.parse(content);
          const result = await apiService.convertJsonToYaml(parsed);
          setContent(result);
        }
        setContentType(newType);
      } catch (error) {
        console.error('Conversion error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setContentType(newType);
    }
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      let config;
      if (contentType === 'yaml') {
        config = await apiService.convertYamlToJson(content);
      } else {
        config = JSON.parse(content);
      }
      const result = await apiService.validateConfig(config);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed']
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      let config;
      if (contentType === 'yaml') {
        config = await apiService.convertYamlToJson(content);
      } else {
        config = JSON.parse(content);
      }
      await apiService.applyConfig(config);
      // Success notification would be handled by the API service
    } catch (error) {
      console.error('Apply error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = (template: 'gateway' | 'route') => {
    if (template === 'gateway') {
      setContent(defaultGatewayYaml);
    } else {
      setContent(defaultRouteYaml);
    }
    setContentType('yaml');
    setValidationResult(null);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config.${contentType}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setContent(content);
        setContentType(file.name.endsWith('.json') ? 'json' : 'yaml');
        setValidationResult(null);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          Configuration Editor
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadIcon />}
          >
            Upload
            <input
              type="file"
              hidden
              accept=".yaml,.yml,.json"
              onChange={handleUpload}
            />
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Templates */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Templates
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleLoadTemplate('gateway')}
                >
                  Gateway Template
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleLoadTemplate('route')}
                >
                  Route Template
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Validation Result */}
          {validationResult && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Validation Result
              </Typography>
              {validationResult.valid ? (
                <Alert severity="success">
                  Configuration is valid
                </Alert>
              ) : (
                <Alert severity="error">
                  <Typography variant="body2" gutterBottom>
                    Validation errors:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {validationResult.errors?.map((error, index) => (
                      <li key={index}>
                        <Typography variant="body2">{error}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}
            </Paper>
          )}
        </Grid>

        {/* Editor */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ overflow: 'hidden' }}>
            {/* Editor Controls */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <FormControl size="small">
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={contentType}
                    label="Format"
                    onChange={(e) => handleTypeChange(e.target.value as 'yaml' | 'json')}
                  >
                    <MenuItem value="yaml">YAML</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ValidateIcon />}
                    onClick={handleValidate}
                    disabled={loading || !content}
                  >
                    Validate
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<ApplyIcon />}
                    onClick={handleApply}
                    disabled={loading || !content || (validationResult && !validationResult.valid)}
                  >
                    Apply
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Code Editor */}
            <AceEditor
              mode={contentType}
              theme={theme === 'dark' ? 'monokai' : 'github'}
              onChange={handleContentChange}
              value={content}
              name="config-editor"
              editorProps={{ $blockScrolling: true }}
              width="100%"
              height="600px"
              fontSize={14}
              showPrintMargin
              showGutter
              highlightActiveLine
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
                useSoftTabs: true,
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const ConfigurationTemplates: React.FC = () => {
  const templates = [
    {
      id: 'basic-gateway',
      name: 'Basic Gateway',
      description: 'A simple HTTP/HTTPS gateway configuration',
      category: 'gateway',
      tags: ['basic', 'http', 'https'],
    },
    {
      id: 'advanced-gateway',
      name: 'Advanced Gateway',
      description: 'Gateway with multiple listeners and TLS termination',
      category: 'gateway',
      tags: ['advanced', 'tls', 'multi-listener'],
    },
    {
      id: 'path-based-route',
      name: 'Path-based Route',
      description: 'Route traffic based on URL path',
      category: 'route',
      tags: ['path', 'routing'],
    },
    {
      id: 'header-based-route',
      name: 'Header-based Route',
      description: 'Route traffic based on request headers',
      category: 'route',
      tags: ['header', 'routing'],
    },
    {
      id: 'rate-limit-policy',
      name: 'Rate Limiting Policy',
      description: 'Apply rate limiting to your routes',
      category: 'policy',
      tags: ['rate-limit', 'policy'],
    },
    {
      id: 'auth-policy',
      name: 'Authentication Policy',
      description: 'JWT authentication configuration',
      category: 'policy',
      tags: ['auth', 'jwt', 'security'],
    },
  ];

  const [selectedCategory, setSelectedCategory] = React.useState<string>('');

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          Configuration Templates
        </Typography>
        <FormControl size="small">
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            label="Category"
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map(category => (
              <MenuItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {filteredTemplates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>
                <Box>
                  {template.tags.map((tag) => (
                    <Typography
                      key={tag}
                      variant="caption"
                      sx={{
                        px: 1,
                        py: 0.5,
                        mr: 0.5,
                        mb: 0.5,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderRadius: 1,
                        display: 'inline-block',
                      }}
                    >
                      {tag}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<CodeIcon />}>
                  View Template
                </Button>
                <Button size="small">Use Template</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const ConfigurationMain: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
        Configuration
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab icon={<CodeIcon />} label="Editor" />
          <Tab icon={<UploadIcon />} label="Templates" />
        </Tabs>
      </Paper>

      {activeTab === 0 && <ConfigurationEditor />}
      {activeTab === 1 && <ConfigurationTemplates />}
    </Box>
  );
};

const Configuration: React.FC = () => {
  return (
    <Routes>
      <Route path="/*" element={<ConfigurationMain />} />
    </Routes>
  );
};

export default Configuration;
