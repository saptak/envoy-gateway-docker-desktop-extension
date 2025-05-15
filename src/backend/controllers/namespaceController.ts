import { Router, Request, Response, NextFunction } from 'express';
import { KubernetesService } from '../services/kubernetesService';
import { LoggerService } from '../utils/logger';
import { Gateway, HTTPRoute, ApiResponse } from '../../shared/types';

const router = Router();
const kubernetesService = KubernetesService.getInstance();
const logger = LoggerService.getInstance();

/**
 * @route GET /api/namespaces
 * @desc List all namespaces with resource counts
 * @access Public
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Listing all namespaces with resource counts');

      const namespaces = await kubernetesService.listNamespaces();
      
      // Get resource counts for each namespace
      const namespacesWithCounts = await Promise.all(
        namespaces.map(async (namespace) => {
          try {
            const [gateways, routes] = await Promise.all([
              kubernetesService.listGateways(namespace),
              kubernetesService.listHTTPRoutes(namespace),
            ]);

            return {
              name: namespace,
              gatewayCount: gateways.length,
              routeCount: routes.length,
              totalResources: gateways.length + routes.length,
            };
          } catch (error) {
            logger.warn(`Error getting resource counts for namespace ${namespace}:`, error);
            return {
              name: namespace,
              gatewayCount: 0,
              routeCount: 0,
              totalResources: 0,
              error: error.message,
            };
          }
        })
      );

      // Filter namespaces with resources or include all if specifically requested
      const includeEmpty = req.query.includeEmpty === 'true';
      const filteredNamespaces = includeEmpty 
        ? namespacesWithCounts
        : namespacesWithCounts.filter(ns => ns.totalResources > 0);

      const response: ApiResponse<{
        namespaces: Array<{
          name: string;
          gatewayCount: number;
          routeCount: number;
          totalResources: number;
          error?: string;
        }>;
        total: number;
        withResources: number;
      }> = {
        success: true,
        data: {
          namespaces: filteredNamespaces,
          total: namespaces.length,
          withResources: filteredNamespaces.length,
        },
        message: `Found ${namespaces.length} namespace(s), ${filteredNamespaces.length} with Gateway/Route resources`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/namespaces/with-resources
 * @desc List only namespaces that contain Gateway or Route resources
 * @access Public
 */
router.get(
  '/with-resources',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Listing namespaces with Gateway/Route resources');

      const namespaces = await kubernetesService.listNamespaces();
      const namespacesWithResources = [];

      for (const namespace of namespaces) {
        try {
          const [gateways, routes] = await Promise.all([
            kubernetesService.listGateways(namespace),
            kubernetesService.listHTTPRoutes(namespace),
          ]);

          if (gateways.length > 0 || routes.length > 0) {
            namespacesWithResources.push({
              name: namespace,
              gatewayCount: gateways.length,
              routeCount: routes.length,
              totalResources: gateways.length + routes.length,
            });
          }
        } catch (error) {
          logger.warn(`Error checking resources in namespace ${namespace}:`, error);
        }
      }

      const response: ApiResponse<typeof namespacesWithResources> = {
        success: true,
        data: namespacesWithResources,
        message: `Found ${namespacesWithResources.length} namespace(s) with resources`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;