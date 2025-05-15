const express = require('express');
const { KubernetesService } = require('../services/kubernetesService');

const router = express.Router();
const kubernetesService = KubernetesService.getInstance();

/**
 * GET /api/namespaces 
 * List all namespaces with resource counts
 */
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching namespaces with resource counts...');
    
    // Get all namespaces
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
          console.warn(`⚠️ Error getting resource counts for namespace ${namespace}:`, error.message);
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

    // Filter namespaces with resources if requested
    const includeEmpty = req.query.includeEmpty === 'true';
    const filteredNamespaces = includeEmpty 
      ? namespacesWithCounts
      : namespacesWithCounts.filter(ns => ns.totalResources > 0);

    res.json({
      success: true,
      data: {
        namespaces: filteredNamespaces,
        total: namespaces.length,
        withResources: filteredNamespaces.length,
      },
      message: `Found ${namespaces.length} namespace(s), ${filteredNamespaces.length} with Gateway/Route resources`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error listing namespaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list namespaces',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/namespaces/with-resources
 * List only namespaces that contain Gateway or Route resources
 */
router.get('/with-resources', async (req, res) => {
  try {
    console.log('🔍 Fetching namespaces with Gateway/Route resources...');
    
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
        console.warn(`⚠️ Error checking resources in namespace ${namespace}:`, error.message);
      }
    }

    res.json({
      success: true,
      data: namespacesWithResources,
      message: `Found ${namespacesWithResources.length} namespace(s) with resources`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error listing namespaces with resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list namespaces with resources',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;