import { Router, Request, Response, NextFunction } from 'express';
import { KubernetesService } from '../services/kubernetesService';
import { LoggerService } from '../utils/logger';
import { HTTPRoute, ApiResponse } from '../../shared/types';
import {
  validateHTTPRoute,
  validateRouteParams,
  validatePagination,
  validateNamespaceQuery,
  validateAndSanitizeRoute,
} from '../middleware/validation';

const router = Router();
const kubernetesService = KubernetesService.getInstance();
const logger = LoggerService.getInstance();

/**
 * @route GET /api/routes
 * @desc List all HTTP routes with optional filtering and pagination
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

      logger.info(`Listing HTTP routes`, { namespace, page, pageSize });

      const routes = await kubernetesService.listHTTPRoutes(namespace);

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRoutes = routes.slice(startIndex, endIndex);

      const response: ApiResponse<{
        routes: HTTPRoute[];
        total: number;
        page: number;
        pageSize: number;
        hasNext: boolean;
      }> = {
        success: true,
        data: {
          routes: paginatedRoutes,
          total: routes.length,
          page,
          pageSize,
          hasNext: endIndex < routes.length,
        },
        message: `Found ${routes.length} route(s)`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/routes/:namespace/:name
 * @desc Get a specific HTTP route
 * @access Public
 */
router.get(
  '/:namespace/:name',
  validateRouteParams,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, name } = req.params;

      logger.info(`Getting HTTP route ${namespace}/${name}`);

      const route = await kubernetesService.getHTTPRoute(name, namespace);

      if (!route) {
        const response: ApiResponse = {
          success: false,
          error: 'Route not found',
          message: `HTTP route ${namespace}/${name} does not exist`,
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<HTTPRoute> = {
        success: true,
        data: route,
        message: `HTTP route ${namespace}/${name} retrieved successfully`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/routes
 * @desc Create a new HTTP route
 * @access Public
 */
router.post(
  '/',
  validateHTTPRoute,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const routeData = validateAndSanitizeRoute(req.body);

      logger.info(`Creating HTTP route ${routeData.namespace}/${routeData.name}`);

      // Ensure namespace exists
      await kubernetesService.ensureNamespace(routeData.namespace);

      // Check if route already exists
      const existingRoute = await kubernetesService.getHTTPRoute(
        routeData.name,
        routeData.namespace
      );

      if (existingRoute) {
        const response: ApiResponse = {
          success: false,
          error: 'Route already exists',
          message: `HTTP route ${routeData.namespace}/${routeData.name} already exists`,
          timestamp: new Date().toISOString(),
        };
        return res.status(409).json(response);
      }

      // Validate parent references
      for (const parentRef of routeData.parentRefs) {
        const gateway = await kubernetesService.getGateway(
          parentRef.name,
          parentRef.namespace || routeData.namespace
        );

        if (!gateway) {
          const response: ApiResponse = {
            success: false,
            error: 'Parent gateway not found',
            message: `Gateway ${parentRef.namespace || routeData.namespace}/${parentRef.name} does not exist`,
            timestamp: new Date().toISOString(),
          };
          return res.status(400).json(response);
        }
      }

      // Create the route
      const route = await kubernetesService.createHTTPRoute(routeData);

      const response: ApiResponse<HTTPRoute> = {
        success: true,
        data: route,
        message: `HTTP route ${route.namespace}/${route.name} created successfully`,
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/routes/:namespace/:name
 * @desc Update an existing HTTP route
 * @access Public
 */
router.put(
  '/:namespace/:name',
  validateRouteParams,
  validateHTTPRoute,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, name } = req.params;
      const routeData = validateAndSanitizeRoute(req.body);

      logger.info(`Updating HTTP route ${namespace}/${name}`);

      // Ensure the route exists
      const existingRoute = await kubernetesService.getHTTPRoute(name, namespace);

      if (!existingRoute) {
        const response: ApiResponse = {
          success: false,
          error: 'Route not found',
          message: `HTTP route ${namespace}/${name} does not exist`,
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      // Ensure name and namespace match the route parameters
      routeData.name = name;
      routeData.namespace = namespace;

      // Validate parent references
      for (const parentRef of routeData.parentRefs) {
        const gateway = await kubernetesService.getGateway(
          parentRef.name,
          parentRef.namespace || namespace
        );

        if (!gateway) {
          const response: ApiResponse = {
            success: false,
            error: 'Parent gateway not found',
            message: `Gateway ${parentRef.namespace || namespace}/${parentRef.name} does not exist`,
            timestamp: new Date().toISOString(),
          };
          return res.status(400).json(response);
        }
      }

      const route = await kubernetesService.updateHTTPRoute(routeData);

      const response: ApiResponse<HTTPRoute> = {
        success: true,
        data: route,
        message: `HTTP route ${namespace}/${name} updated successfully`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/routes/:namespace/:name
 * @desc Delete an HTTP route
 * @access Public
 */
router.delete(
  '/:namespace/:name',
  validateRouteParams,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, name } = req.params;

      logger.info(`Deleting HTTP route ${namespace}/${name}`);

      // Check if route exists
      const existingRoute = await kubernetesService.getHTTPRoute(name, namespace);

      if (!existingRoute) {
        const response: ApiResponse = {
          success: false,
          error: 'Route not found',
          message: `HTTP route ${namespace}/${name} does not exist`,
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      await kubernetesService.deleteHTTPRoute(name, namespace);

      const response: ApiResponse = {
        success: true,
        message: `HTTP route ${namespace}/${name} deleted successfully`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/routes/:namespace/:name/status
 * @desc Get HTTP route status
 * @access Public
 */
router.get(
  '/:namespace/:name/status',
  validateRouteParams,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, name } = req.params;

      logger.info(`Getting HTTP route status ${namespace}/${name}`);

      const route = await kubernetesService.getHTTPRoute(name, namespace);

      if (!route) {
        const response: ApiResponse = {
          success: false,
          error: 'Route not found',
          message: `HTTP route ${namespace}/${name} does not exist`,
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<{
        status: string;
        conditions: any[];
        parentRefs: any[];
      }> = {
        success: true,
        data: {
          status: route.status,
          conditions: route.conditions || [],
          parentRefs: route.parentRefs,
        },
        message: `HTTP route status retrieved successfully`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/routes/:namespace/:name/validate
 * @desc Validate HTTP route configuration without creating it
 * @access Public
 */
router.post(
  '/:namespace/:name/validate',
  validateRouteParams,
  validateHTTPRoute,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, name } = req.params;
      const routeData = validateAndSanitizeRoute(req.body);

      logger.info(`Validating HTTP route configuration ${namespace}/${name}`);

      // Ensure name and namespace match
      routeData.name = name;
      routeData.namespace = namespace;

      // Perform validation checks
      const validationResults = {
        valid: true,
        errors: [] as string[],
        warnings: [] as string[],
      };

      // Check parent references
      for (const parentRef of routeData.parentRefs) {
        const gateway = await kubernetesService.getGateway(
          parentRef.name,
          parentRef.namespace || namespace
        );

        if (!gateway) {
          validationResults.valid = false;
          validationResults.errors.push(
            `Parent gateway ${parentRef.namespace || namespace}/${parentRef.name} does not exist`
          );
        }
      }

      // Check if rules are defined
      if (!routeData.rules || routeData.rules.length === 0) {
        validationResults.valid = false;
        validationResults.errors.push('At least one rule is required');
      }

      // Validate rules
      for (let i = 0; i < routeData.rules.length; i++) {
        const rule = routeData.rules[i];

        // Check if rule has either matches or backendRefs
        if (!rule.matches && !rule.backendRefs) {
          validationResults.valid = false;
          validationResults.errors.push(`Rule ${i + 1}: Either matches or backendRefs must be specified`);
        }

        // Validate backend references
        if (rule.backendRefs) {
          for (const backendRef of rule.backendRefs) {
            if (!backendRef.name) {
              validationResults.valid = false;
              validationResults.errors.push(`Rule ${i + 1}: Backend reference name is required`);
            }
          }
        }

        // Validate path matches
        if (rule.matches) {
          for (const match of rule.matches) {
            if (match.path && match.path.type === 'RegularExpression') {
              try {
                new RegExp(match.path.value);
              } catch (error) {
                validationResults.valid = false;
                validationResults.errors.push(
                  `Rule ${i + 1}: Invalid regular expression in path match: ${match.path.value}`
                );
              }
            }
          }
        }
      }

      // Validate hostnames
      if (routeData.hostnames) {
        for (const hostname of routeData.hostnames) {
          if (!hostname.match(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/)) {
            validationResults.valid = false;
            validationResults.errors.push(`Invalid hostname: ${hostname}`);
          }
        }
      }

      const response: ApiResponse<typeof validationResults> = {
        success: true,
        data: validationResults,
        message: validationResults.valid 
          ? 'HTTP route configuration is valid' 
          : 'HTTP route configuration has errors',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/routes/by-gateway/:namespace/:gatewayName
 * @desc Get all routes for a specific gateway
 * @access Public
 */
router.get(
  '/by-gateway/:namespace/:gatewayName',
  validateRouteParams,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { namespace, gatewayName } = req.params;

      logger.info(`Getting routes for gateway ${namespace}/${gatewayName}`);

      // Get all routes and filter by parent reference
      const allRoutes = await kubernetesService.listHTTPRoutes(namespace);
      const gatewayRoutes = allRoutes.filter(route =>
        route.parentRefs.some(ref => 
          ref.name === gatewayName && 
          (ref.namespace || route.namespace) === namespace
        )
      );

      const response: ApiResponse<HTTPRoute[]> = {
        success: true,
        data: gatewayRoutes,
        message: `Found ${gatewayRoutes.length} route(s) for gateway ${namespace}/${gatewayName}`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
