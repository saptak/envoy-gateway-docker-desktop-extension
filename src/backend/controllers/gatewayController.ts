import { Router, Request, Response, NextFunction } from 'express';
import { KubernetesService } from '../services/kubernetesService';
import { WebSocketService } from '../services/websocketService';
import { LoggerService } from '../utils/logger';
import { Gateway, ApiResponse } from '../../shared/types';
import {
  validateGateway,
  validateRouteParams,
  validatePagination,
  validateNamespaceQuery,
  validateAndSanitizeGateway,
} from '../middleware/validation';

const router = Router();
const kubernetesService = KubernetesService.getInstance();
const logger = LoggerService.getInstance();

/**
 * @route GET /api/gateways
 * @desc List all gateways with optional filtering and pagination
 * @access Public
 */
router.get(
  '/',
  validatePagination,
  validateNamespaceQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace } = req.query as { namespace?: string };
      const { page, pageSize } = req.query as { page: number; pageSize: number };

      logger.info(`Listing gateways`, { namespace, page, pageSize });

      const gateways = await kubernetesService.listGateways(namespace);

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedGateways = gateways.slice(startIndex, endIndex);

      const response: ApiResponse<{
        gateways: Gateway[];
        total: number;
        page: number;
        pageSize: number;
        hasNext: boolean;
      }> = {
        success: true,
        data: {
          gateways: paginatedGateways,
          total: gateways.length,
          page,
          pageSize,
          hasNext: endIndex < gateways.length,
        },
        message: `Found ${gateways.length} gateway(s) in ${namespace ? `namespace ${namespace}` : 'default namespace'}`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/gateways/all-namespaces
 * @desc List all gateways across all namespaces
 * @access Public
 */
router.get(
  '/all-namespaces',
  validatePagination,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize } = req.query as { page: number; pageSize: number };

      logger.info(`Listing gateways across all namespaces`, { page, pageSize });

      // Get all namespaces first
      const namespaces = await kubernetesService.listNamespaces();
      
      // Get gateways from all namespaces
      const allGateways: (Gateway & { namespace: string })[] = [];
      
      for (const namespace of namespaces) {
        try {
          const gateways = await kubernetesService.listGateways(namespace);
          allGateways.push(...gateways.map(gateway => ({ ...gateway, namespace })));
        } catch (error) {
          logger.warn(`Error listing gateways in namespace ${namespace}:`, error);
        }
      }

      // Sort by namespace then by name
      allGateways.sort((a, b) => {
        if (a.namespace !== b.namespace) {
          return a.namespace.localeCompare(b.namespace);
        }
        return a.name.localeCompare(b.name);
      });

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedGateways = allGateways.slice(startIndex, endIndex);

      const response: ApiResponse<{
        gateways: Gateway[];
        total: number;
        page: number;
        pageSize: number;
        hasNext: boolean;
        namespaceCounts: Record<string, number>;
      }> = {
        success: true,
        data: {
          gateways: paginatedGateways,
          total: allGateways.length,
          page,
          pageSize,
          hasNext: endIndex < allGateways.length,
          namespaceCounts: namespaces.reduce((acc, ns) => {
            acc[ns] = allGateways.filter(g => g.namespace === ns).length;
            return acc;
          }, {} as Record<string, number>),
        },
        message: `Found ${allGateways.length} gateway(s) across ${namespaces.length} namespace(s)`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/gateways/:namespace/:name
 * @desc Get a specific gateway
 * @access Public
 */
router.get(
  '/:namespace/:name',
  validateRouteParams,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, name } = req.params;

      logger.info(`Getting gateway ${namespace}/${name}`);

      const gateway = await kubernetesService.getGateway(name, namespace);

      if (!gateway) {
        const response: ApiResponse = {
          success: false,
          error: 'Gateway not found',
          message: `Gateway ${namespace}/${name} does not exist`,
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<Gateway> = {
        success: true,
        data: gateway,
        message: `Gateway ${namespace}/${name} retrieved successfully`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/gateways
 * @desc Create a new gateway
 * @access Public
 */
router.post(
  '/',
  validateGateway,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const gatewayData = validateAndSanitizeGateway(req.body);

      logger.info(`Creating gateway ${gatewayData.namespace}/${gatewayData.name}`);

      // Ensure namespace exists
      await kubernetesService.ensureNamespace(gatewayData.namespace);

      // Check if gateway already exists
      const existingGateway = await kubernetesService.getGateway(
        gatewayData.name,
        gatewayData.namespace
      );

      if (existingGateway) {
        const response: ApiResponse = {
          success: false,
          error: 'Gateway already exists',
          message: `Gateway ${gatewayData.namespace}/${gatewayData.name} already exists`,
          timestamp: new Date().toISOString(),
        };
        return res.status(409).json(response);
      }

      // Create the gateway
      const gateway = await kubernetesService.createGateway(gatewayData);

      const response: ApiResponse<Gateway> = {
        success: true,
        data: gateway,
        message: `Gateway ${gateway.namespace}/${gateway.name} created successfully`,
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/gateways/:namespace/:name
 * @desc Update an existing gateway
 * @access Public
 */
router.put(
  '/:namespace/:name',
  validateRouteParams,
  validateGateway,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, name } = req.params;
      const gatewayData = validateAndSanitizeGateway(req.body);

      logger.info(`Updating gateway ${namespace}/${name}`);

      // Ensure the gateway exists
      const existingGateway = await kubernetesService.getGateway(name, namespace);

      if (!existingGateway) {
        const response: ApiResponse = {
          success: false,
          error: 'Gateway not found',
          message: `Gateway ${namespace}/${name} does not exist`,
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      // Ensure name and namespace match the route parameters
      gatewayData.name = name;
      gatewayData.namespace = namespace;

      const gateway = await kubernetesService.updateGateway(gatewayData);

      const response: ApiResponse<Gateway> = {
        success: true,
        data: gateway,
        message: `Gateway ${namespace}/${name} updated successfully`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/gateways/:namespace/:name
 * @desc Delete a gateway
 * @access Public
 */
router.delete(
  '/:namespace/:name',
  validateRouteParams,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, name } = req.params;

      logger.info(`Deleting gateway ${namespace}/${name}`);

      // Check if gateway exists
      const existingGateway = await kubernetesService.getGateway(name, namespace);

      if (!existingGateway) {
        const response: ApiResponse = {
          success: false,
          error: 'Gateway not found',
          message: `Gateway ${namespace}/${name} does not exist`,
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      await kubernetesService.deleteGateway(name, namespace);

      const response: ApiResponse = {
        success: true,
        message: `Gateway ${namespace}/${name} deleted successfully`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/gateways/:namespace/:name/status
 * @desc Get gateway status
 * @access Public
 */
router.get(
  '/:namespace/:name/status',
  validateRouteParams,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, name } = req.params;

      logger.info(`Getting gateway status ${namespace}/${name}`);

      const gateway = await kubernetesService.getGateway(name, namespace);

      if (!gateway) {
        const response: ApiResponse = {
          success: false,
          error: 'Gateway not found',
          message: `Gateway ${namespace}/${name} does not exist`,
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<{
        status: string;
        listeners: any[];
        conditions: any[];
      }> = {
        success: true,
        data: {
          status: gateway.status,
          listeners: gateway.listeners,
          conditions: gateway.conditions || [],
        },
        message: `Gateway status retrieved successfully`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/gateways/:namespace/:name/validate
 * @desc Validate gateway configuration without creating it
 * @access Public
 */
router.post(
  '/:namespace/:name/validate',
  validateRouteParams,
  validateGateway,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, name } = req.params;
      const gatewayData = validateAndSanitizeGateway(req.body);

      logger.info(`Validating gateway configuration ${namespace}/${name}`);

      // Ensure name and namespace match
      gatewayData.name = name;
      gatewayData.namespace = namespace;

      // Perform validation checks
      const validationResults = {
        valid: true,
        errors: [] as string[],
        warnings: [] as string[],
      };

      // Check if gateway class exists (this is a simplified check)
      if (!gatewayData.spec.gatewayClassName) {
        validationResults.valid = false;
        validationResults.errors.push('Gateway class name is required');
      }

      // Check if listeners are valid
      if (!gatewayData.spec.listeners || gatewayData.spec.listeners.length === 0) {
        validationResults.valid = false;
        validationResults.errors.push('At least one listener is required');
      }

      // Check for port conflicts
      const ports = gatewayData.spec.listeners.map((listener: any) => listener.port);
      const uniquePorts = [...new Set(ports)];
      if (ports.length !== uniquePorts.length) {
        validationResults.valid = false;
        validationResults.errors.push('Duplicate ports found in listeners');
      }

      // Check for valid protocols
      for (const listener of gatewayData.spec.listeners) {
        if (!['HTTP', 'HTTPS', 'TLS', 'TCP', 'UDP'].includes(listener.protocol)) {
          validationResults.valid = false;
          validationResults.errors.push(`Invalid protocol: ${listener.protocol}`);
        }
      }

      const response: ApiResponse<typeof validationResults> = {
        success: true,
        data: validationResults,
        message: validationResults.valid 
          ? 'Gateway configuration is valid' 
          : 'Gateway configuration has errors',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;