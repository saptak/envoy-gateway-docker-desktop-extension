import { Router, Request, Response, NextFunction } from 'express';
import { KubernetesService } from '../services/kubernetesService';
import { LoggerService } from '../utils/logger';
import { ApiResponse, EnvoyGatewayConfig } from '../../shared/types';
import { validateYamlConfig } from '../middleware/validation';
import * as yaml from 'js-yaml';

const router = Router();
const kubernetesService = KubernetesService.getInstance();
const logger = LoggerService.getInstance();

/**
 * @route GET /api/config/envoy-gateway
 * @desc Get Envoy Gateway configuration
 * @access Public
 */
router.get('/envoy-gateway', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Getting Envoy Gateway configuration');

    // Try to get the ConfigMap from the envoy-gateway-system namespace
    try {
      const configMap = await kubernetesService.coreV1Api.readNamespacedConfigMap(
        'envoy-gateway-config',
        'envoy-gateway-system'
      );

      const config = yaml.load(configMap.body.data?.['envoy-gateway.yaml'] || '{}') as EnvoyGatewayConfig;

      const response: ApiResponse<EnvoyGatewayConfig> = {
        success: true,
        data: config,
        message: 'Envoy Gateway configuration retrieved successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      if (error.statusCode === 404) {
        // Return default configuration if not found
        const defaultConfig: EnvoyGatewayConfig = {
          logging: {
            level: 'info',
          },
          telemetry: {
            metrics: {
              prometheus: {
                disable: false,
              },
            },
          },
          provider: {
            type: 'Kubernetes',
          },
        };

        const response: ApiResponse<EnvoyGatewayConfig> = {
          success: true,
          data: defaultConfig,
          message: 'Using default Envoy Gateway configuration',
          timestamp: new Date().toISOString(),
        };

        res.json(response);
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/config/envoy-gateway
 * @desc Update Envoy Gateway configuration
 * @access Public
 */
router.put('/envoy-gateway', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = req.body as EnvoyGatewayConfig;

    logger.info('Updating Envoy Gateway configuration');

    // Validate configuration
    if (!config.provider || config.provider.type !== 'Kubernetes') {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid configuration',
        message: 'Provider type must be Kubernetes',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Create or update ConfigMap
    const configMapData = {
      'envoy-gateway.yaml': yaml.dump(config),
    };

    try {
      // Try to update existing ConfigMap
      await kubernetesService.coreV1Api.replaceNamespacedConfigMap(
        'envoy-gateway-config',
        'envoy-gateway-system',
        {
          metadata: {
            name: 'envoy-gateway-config',
            namespace: 'envoy-gateway-system',
          },
          data: configMapData,
        }
      );
    } catch (error) {
      if (error.statusCode === 404) {
        // Create ConfigMap if it doesn't exist
        await kubernetesService.coreV1Api.createNamespacedConfigMap(
          'envoy-gateway-system',
          {
            metadata: {
              name: 'envoy-gateway-config',
              namespace: 'envoy-gateway-system',
            },
            data: configMapData,
          }
        );
      } else {
        throw error;
      }
    }

    const response: ApiResponse<EnvoyGatewayConfig> = {
      success: true,
      data: config,
      message: 'Envoy Gateway configuration updated successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/config/apply-yaml
 * @desc Apply YAML configuration to the cluster
 * @access Public
 */
router.post('/apply-yaml', validateYamlConfig, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const yamlContent = req.body.yaml || req.body;

    logger.info('Applying YAML configuration');

    const results = await kubernetesService.applyYamlConfiguration(yamlContent);

    const response: ApiResponse<{ applied: number; results: any[] }> = {
      success: true,
      data: {
        applied: results.length,
        results: results,
      },
      message: `Successfully applied ${results.length} resource(s)`,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/config/validate-yaml
 * @desc Validate YAML configuration without applying it
 * @access Public
 */
router.post('/validate-yaml', validateYamlConfig, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const yamlContent = req.body.yaml || req.body;

    logger.info('Validating YAML configuration');

    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      resources: [] as any[],
    };

    try {
      // Parse YAML
      const docs = yaml.loadAll(yamlContent);
      
      for (const doc of docs) {
        if (!doc || typeof doc !== 'object') continue;

        const resource = doc as any;
        validation.resources.push({
          apiVersion: resource.apiVersion,
          kind: resource.kind,
          name: resource.metadata?.name,
          namespace: resource.metadata?.namespace,
        });

        // Basic validation
        if (!resource.apiVersion) {
          validation.valid = false;
          validation.errors.push(`Resource missing apiVersion`);
        }

        if (!resource.kind) {
          validation.valid = false;
          validation.errors.push(`Resource missing kind`);
        }

        if (!resource.metadata?.name) {
          validation.valid = false;
          validation.errors.push(`Resource missing metadata.name`);
        }

        // Specific validations for Gateway API resources
        if (resource.kind === 'Gateway' && resource.apiVersion.includes('gateway.networking.k8s.io')) {
          if (!resource.spec?.listeners || resource.spec.listeners.length === 0) {
            validation.valid = false;
            validation.errors.push(`Gateway ${resource.metadata.name}: At least one listener is required`);
          }
        }

        if (resource.kind === 'HTTPRoute' && resource.apiVersion.includes('gateway.networking.k8s.io')) {
          if (!resource.spec?.parentRefs || resource.spec.parentRefs.length === 0) {
            validation.valid = false;
            validation.errors.push(`HTTPRoute ${resource.metadata.name}: At least one parent reference is required`);
          }

          if (!resource.spec?.rules || resource.spec.rules.length === 0) {
            validation.valid = false;
            validation.errors.push(`HTTPRoute ${resource.metadata.name}: At least one rule is required`);
          }
        }
      }

      if (validation.resources.length === 0) {
        validation.valid = false;
        validation.errors.push('No valid resources found in YAML');
      }

    } catch (parseError) {
      validation.valid = false;
      validation.errors.push(`YAML parsing error: ${parseError.message}`);
    }

    const response: ApiResponse<typeof validation> = {
      success: true,
      data: validation,
      message: validation.valid 
        ? `YAML configuration is valid (${validation.resources.length} resources)` 
        : 'YAML configuration has errors',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/config/export
 * @desc Export current gateway and route configurations
 * @access Public
 */
router.get('/export', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { namespace, format = 'yaml' } = req.query as { namespace?: string; format?: string };

    logger.info('Exporting configuration', { namespace, format });

    // Get all gateways and routes
    const [gateways, routes] = await Promise.all([
      kubernetesService.listGateways(namespace),
      kubernetesService.listHTTPRoutes(namespace),
    ]);

    const resources = [];

    // Add gateways
    for (const gateway of gateways) {
      resources.push({
        apiVersion: 'gateway.networking.k8s.io/v1beta1',
        kind: 'Gateway',
        metadata: {
          name: gateway.name,
          namespace: gateway.namespace,
        },
        spec: gateway.spec,
      });
    }

    // Add routes
    for (const route of routes) {
      resources.push({
        apiVersion: 'gateway.networking.k8s.io/v1beta1',
        kind: 'HTTPRoute',
        metadata: {
          name: route.name,
          namespace: route.namespace,
        },
        spec: {
          parentRefs: route.parentRefs,
          hostnames: route.hostnames,
          rules: route.rules,
        },
      });
    }

    let exportData: string | any[];
    let contentType: string;

    if (format === 'json') {
      exportData = resources;
      contentType = 'application/json';
    } else {
      // Default to YAML
      exportData = resources.map(resource => yaml.dump(resource)).join('---\n');
      contentType = 'application/x-yaml';
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        format,
        resourceCount: resources.length,
        content: exportData,
      },
      message: `Exported ${resources.length} resource(s) in ${format} format`,
      timestamp: new Date().toISOString(),
    };

    res.setHeader('Content-Type', contentType);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/config/namespaces
 * @desc Get list of available namespaces
 * @access Public
 */
router.get('/namespaces', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Getting available namespaces');

    const namespaces = await kubernetesService.listNamespaces();

    const response: ApiResponse<string[]> = {
      success: true,
      data: namespaces,
      message: `Found ${namespaces.length} namespace(s)`,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/config/cluster-info
 * @desc Get Kubernetes cluster information
 * @access Public
 */
router.get('/cluster-info', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Getting cluster information');

    const clusterInfo = await kubernetesService.getClusterInfo();
    const isEnvoyGatewayInstalled = await kubernetesService.isEnvoyGatewayInstalled();

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...clusterInfo,
        envoyGatewayInstalled: isEnvoyGatewayInstalled,
      },
      message: 'Cluster information retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/config/create-namespace
 * @desc Create a new namespace
 * @access Public
 */
router.post('/create-namespace', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid namespace name',
        message: 'Namespace name is required and must be a string',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    logger.info(`Creating namespace: ${name}`);

    await kubernetesService.ensureNamespace(name);

    const response: ApiResponse<{ name: string }> = {
      success: true,
      data: { name },
      message: `Namespace ${name} created successfully`,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
