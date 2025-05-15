import { Router, Request, Response, NextFunction } from 'express';
import { KubernetesService } from '../services/kubernetesService';
import { DockerService } from '../services/dockerService';
import { LoggerService } from '../utils/logger';
import { ApiResponse } from '../../shared/types';

const router = Router();
const kubernetesService = KubernetesService.getInstance();
const dockerService = DockerService.getInstance();
const logger = LoggerService.getInstance();

/**
 * @route GET /api/health
 * @desc Get overall health status of the extension
 * @access Public
 */
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Health check requested');

    const startTime = Date.now();

    // Check all services
    const [kubernetesHealth, dockerHealth] = await Promise.allSettled([
      kubernetesService.healthCheck(),
      dockerService.healthCheck(),
    ]);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Aggregate health status
    const overallHealth = {
      status: 'healthy',
      services: {
        kubernetes: kubernetesHealth.status === 'fulfilled' 
          ? kubernetesHealth.value 
          : { status: 'unhealthy', error: kubernetesHealth.reason },
        docker: dockerHealth.status === 'fulfilled' 
          ? dockerHealth.value 
          : { status: 'unhealthy', error: dockerHealth.reason },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    };

    // Determine overall status
    const serviceStatuses = Object.values(overallHealth.services).map(service => service.status);
    if (serviceStatuses.includes('unhealthy')) {
      overallHealth.status = 'degraded';
    }
    if (serviceStatuses.every(status => status === 'unhealthy')) {
      overallHealth.status = 'unhealthy';
    }

    const statusCode = overallHealth.status === 'healthy' ? 200 : 503;

    const response: ApiResponse<typeof overallHealth> = {
      success: overallHealth.status !== 'unhealthy',
      data: overallHealth,
      message: `System status: ${overallHealth.status}`,
      timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Health check failed:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Health check failed',
      message: 'Unable to perform health check',
      timestamp: new Date().toISOString(),
    };

    res.status(503).json(response);
  }
});

/**
 * @route POST /api/health/reconnect
 * @desc Force reconnection to Kubernetes cluster
 * @access Public
 */
router.post('/reconnect', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Kubernetes reconnection requested');

    const startTime = Date.now();

    // Get diagnostics before reconnecting
    const beforeDiagnostics = await kubernetesService.getConnectionDiagnostics();
    
    // Attempt reconnection
    await kubernetesService.reconnect();
    
    // Get health status after reconnection
    const afterHealth = await kubernetesService.healthCheck();
    const afterDiagnostics = await kubernetesService.getConnectionDiagnostics();

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const reconnectResult = {
      success: afterHealth.status === 'healthy',
      reconnectionTime: `${responseTime}ms`,
      before: {
        status: 'disconnected',
        connectionStrategy: beforeDiagnostics.currentStrategy,
      },
      after: {
        status: afterHealth.status,
        connectionStrategy: afterDiagnostics.currentStrategy,
        version: afterHealth.version,
        details: afterHealth.details,
      },
      diagnostics: afterDiagnostics,
      timestamp: new Date().toISOString(),
    };

    const response: ApiResponse<typeof reconnectResult> = {
      success: reconnectResult.success,
      data: reconnectResult,
      message: reconnectResult.success 
        ? 'Successfully reconnected to Kubernetes'
        : 'Reconnection attempted but connection still unhealthy',
      timestamp: new Date().toISOString(),
    };

    const statusCode = reconnectResult.success ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Kubernetes reconnection failed:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Reconnection failed',
      message: error.message || 'Unable to reconnect to Kubernetes',
      timestamp: new Date().toISOString(),
    };

    res.status(503).json(response);
  }
});

/**
 * @route GET /api/health/diagnostics
 * @desc Get connection diagnostics for troubleshooting
 * @access Public
 */
router.get('/diagnostics', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Connection diagnostics requested');

    const diagnostics = await kubernetesService.getConnectionDiagnostics();
    const health = await kubernetesService.healthCheck();

    const detailedDiagnostics = {
      connectionHealth: health,
      connectionDiagnostics: diagnostics,
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        kubeConfigPath: process.env.KUBE_CONFIG_PATH,
        inDocker: process.env.NODE_ENV === 'production',
      },
      timestamp: new Date().toISOString(),
    };

    const response: ApiResponse<typeof detailedDiagnostics> = {
      success: true,
      data: detailedDiagnostics,
      message: 'Connection diagnostics retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/health/liveness
 * @desc Kubernetes liveness probe endpoint
 * @access Public
 */
router.get('/liveness', (req: Request, res: Response): void => {
  // Simple liveness check - just verify the process is running
  const response = {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  res.json(response);
});

/**
 * @route GET /api/health/readiness
 * @desc Kubernetes readiness probe endpoint
 * @access Public
 */
router.get('/readiness', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if critical services are ready
    const [kubernetesReady, dockerReady] = await Promise.allSettled([
      kubernetesService.healthCheck(),
      dockerService.healthCheck(),
    ]);

    const isReady = kubernetesReady.status === 'fulfilled' && 
                   kubernetesReady.value.status === 'healthy' &&
                   dockerReady.status === 'fulfilled' && 
                   dockerReady.value.status === 'healthy';

    const response = {
      status: isReady ? 'ready' : 'not-ready',
      services: {
        kubernetes: kubernetesReady.status === 'fulfilled' ? kubernetesReady.value.status : 'unhealthy',
        docker: dockerReady.status === 'fulfilled' ? dockerReady.value.status : 'unhealthy',
      },
      timestamp: new Date().toISOString(),
    };

    const statusCode = isReady ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Readiness check failed:', error);
    
    const response = {
      status: 'not-ready',
      error: 'Readiness check failed',
      timestamp: new Date().toISOString(),
    };

    res.status(503).json(response);
  }
});

/**
 * @route GET /api/health/kubernetes
 * @desc Detailed Kubernetes health check
 * @access Public
 */
router.get('/kubernetes', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Kubernetes health check requested');

    const health = await kubernetesService.healthCheck();
    
    // Additional Kubernetes-specific checks
    const clusterInfo = await kubernetesService.getClusterInfo();
    const namespaces = await kubernetesService.listNamespaces();

    const detailedHealth = {
      ...health,
      cluster: clusterInfo,
      namespaceCount: namespaces.length,
      envoyGatewayInstalled: health.details?.envoyGatewayInstalled || false,
    };

    const response: ApiResponse<typeof detailedHealth> = {
      success: health.status === 'healthy',
      data: detailedHealth,
      message: `Kubernetes status: ${health.status}`,
      timestamp: new Date().toISOString(),
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/health/docker
 * @desc Detailed Docker health check
 * @access Public
 */
router.get('/docker', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Docker health check requested');

    const health = await dockerService.healthCheck();
    
    // Additional Docker-specific checks
    const containers = await dockerService.listContainers(true);
    const images = await dockerService.listImages();
    const networks = await dockerService.listNetworks();

    const detailedHealth = {
      ...health,
      containers: {
        total: containers.length,
        running: containers.filter(c => c.state === 'running').length,
        stopped: containers.filter(c => c.state === 'exited').length,
      },
      images: {
        total: images.length,
      },
      networks: {
        total: networks.length,
      },
    };

    const response: ApiResponse<typeof detailedHealth> = {
      success: health.status === 'healthy',
      data: detailedHealth,
      message: `Docker status: ${health.status}`,
      timestamp: new Date().toISOString(),
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/health/metrics
 * @desc Get system metrics
 * @access Public
 */
router.get('/metrics', (req: Request, res: Response): void => {
  const metrics = {
    system: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
    application: {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
    },
    timestamp: new Date().toISOString(),
  };

  const response: ApiResponse<typeof metrics> = {
    success: true,
    data: metrics,
    message: 'System metrics retrieved successfully',
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @route POST /api/health/ping
 * @desc Simple ping endpoint for connectivity testing
 * @access Public
 */
router.post('/ping', (req: Request, res: Response): void => {
  const { message } = req.body;
  
  const response = {
    pong: true,
    message: message || 'pong',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'],
  };

  res.json(response);
});

export default router;