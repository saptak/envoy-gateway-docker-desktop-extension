import { jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/backend/middleware/errorHandler';
import { requestLogger } from '../../src/backend/middleware/requestLogger';
import { 
  validateGateway, 
  validateHTTPRoute, 
  validateKubernetesName,
  validateNamespaceName,
  validatePort,
  validateHostname,
  validateHTTPMethod,
  sanitizeString
} from '../../src/backend/middleware/validation';
import { ExtensionError, ValidationError, KubernetesError, DockerError } from '../../src/shared/types';

describe('Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/test',
      headers: {},
      body: {},
      params: {},
      query: {},
      path: '/test',
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' } as any,
      get: jest.fn(),
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      getHeader: jest.fn(),
      headersSent: false,
      on: jest.fn(),
    };

    next = jest.fn();
  });

  describe('Error Handler', () => {
    it('should handle ExtensionError correctly', () => {
      const error = new ExtensionError('Test error', 'TEST_ERROR', 400, { test: 'details' });
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'TEST_ERROR',
            message: 'Test error',
          }),
        })
      );
    });

    it('should handle ValidationError correctly', () => {
      const error = new ValidationError('Validation failed', { field: 'test' });
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
          }),
        })
      );
    });

    it('should handle KubernetesError correctly', () => {
      const error = new KubernetesError('K8s error');
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'KUBERNETES_ERROR',
            message: 'K8s error',
          }),
        })
      );
    });

    it('should handle DockerError correctly', () => {
      const error = new DockerError('Docker error');
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'DOCKER_ERROR',
            message: 'Docker error',
          }),
        })
      );
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_ERROR',
          }),
        })
      );
    });

    it('should call next if headers already sent', () => {
      res.headersSent = true;
      const error = new Error('Test error');
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Request Logger', () => {
    it('should add request ID and start time', () => {
      requestLogger(req as Request, res as Response, next);
      
      expect((req as any).id).toBeDefined();
      expect((req as any).startTime).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
      expect(next).toHaveBeenCalled();
    });

    it('should use existing request ID from headers', () => {
      const existingId = 'existing-id';
      req.headers = { 'x-request-id': existingId };
      
      requestLogger(req as Request, res as Response, next);
      
      expect((req as any).id).toBe(existingId);
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
    });

    it('should override res.json to log response', () => {
      // Create a mock for the original json method
      const originalJson = jest.fn().mockReturnThis();
      res.json = originalJson;
      
      requestLogger(req as Request, res as Response, next);
      
      const testBody = { test: 'data' };
      
      // Call the overridden json method
      (res.json as any)(testBody);
      
      // Verify the original method was called
      expect(originalJson).toHaveBeenCalledWith(testBody);
    });
  });

  describe('Validation Functions', () => {
    describe('validateKubernetesName', () => {
      it('should validate correct Kubernetes names', () => {
        expect(validateKubernetesName('valid-name')).toBe(true);
        expect(validateKubernetesName('name123')).toBe(true);
        expect(validateKubernetesName('a')).toBe(true);
        expect(validateKubernetesName('123')).toBe(true);
      });

      it('should reject invalid Kubernetes names', () => {
        expect(validateKubernetesName('UPPERCASE')).toBe(false);
        expect(validateKubernetesName('-start-dash')).toBe(false);
        expect(validateKubernetesName('end-dash-')).toBe(false);
        expect(validateKubernetesName('under_score')).toBe(false);
        expect(validateKubernetesName('special@char')).toBe(false);
        expect(validateKubernetesName('')).toBe(false);
        expect(validateKubernetesName('a'.repeat(64))).toBe(false); // Too long
      });
    });

    describe('validateNamespaceName', () => {
      it('should validate namespace names using same rules as Kubernetes names', () => {
        expect(validateNamespaceName('valid-namespace')).toBe(true);
        expect(validateNamespaceName('INVALID-NAMESPACE')).toBe(false);
      });
    });

    describe('validatePort', () => {
      it('should validate valid port numbers', () => {
        expect(validatePort(80)).toBe(true);
        expect(validatePort(443)).toBe(true);
        expect(validatePort(8080)).toBe(true);
        expect(validatePort(65535)).toBe(true);
        expect(validatePort(1)).toBe(true);
      });

      it('should reject invalid port numbers', () => {
        expect(validatePort(0)).toBe(false);
        expect(validatePort(-1)).toBe(false);
        expect(validatePort(65536)).toBe(false);
        expect(validatePort(1.5)).toBe(false);
        expect(validatePort(NaN)).toBe(false);
      });
    });

    describe('validateHostname', () => {
      it('should validate correct hostnames', () => {
        expect(validateHostname('example.com')).toBe(true);
        expect(validateHostname('sub.example.com')).toBe(true);
        expect(validateHostname('valid-hostname')).toBe(true);
        expect(validateHostname('123.example.com')).toBe(true);
      });

      it('should reject invalid hostnames', () => {
        expect(validateHostname('UPPERCASE.COM')).toBe(false);
        expect(validateHostname('-start-dash.com')).toBe(false);
        expect(validateHostname('example..com')).toBe(false);
        expect(validateHostname('.example.com')).toBe(false);
        expect(validateHostname('example.com.')).toBe(false);
      });
    });

    describe('validateHTTPMethod', () => {
      it('should validate correct HTTP methods', () => {
        expect(validateHTTPMethod('GET')).toBe(true);
        expect(validateHTTPMethod('POST')).toBe(true);
        expect(validateHTTPMethod('PUT')).toBe(true);
        expect(validateHTTPMethod('DELETE')).toBe(true);
        expect(validateHTTPMethod('get')).toBe(true); // Case insensitive
        expect(validateHTTPMethod('post')).toBe(true);
      });

      it('should reject invalid HTTP methods', () => {
        expect(validateHTTPMethod('INVALID')).toBe(false);
        expect(validateHTTPMethod('')).toBe(false);
        expect(validateHTTPMethod('GET_POST')).toBe(false);
      });
    });

    describe('sanitizeString', () => {
      it('should trim whitespace', () => {
        expect(sanitizeString('  test  ')).toBe('test');
        expect(sanitizeString('\n\ttest\n\t')).toBe('test');
      });

      it('should remove dangerous characters', () => {
        expect(sanitizeString('test<script>')).toBe('testscript');
        expect(sanitizeString('test>alert()')).toBe('testalert()');
        expect(sanitizeString('<>test<>')).toBe('test');
      });

      it('should preserve safe content', () => {
        expect(sanitizeString('valid-name123')).toBe('valid-name123');
        expect(sanitizeString('safe text')).toBe('safe text');
        expect(sanitizeString('test@example.com')).toBe('test@example.com');
      });
    });
  });

  describe('Gateway Validation', () => {
    it('should pass valid gateway configuration', async () => {
      const validGateway = {
        name: 'test-gateway',
        namespace: 'default',
        spec: {
          gatewayClassName: 'test-class',
          listeners: [
            {
              name: 'http',
              port: 8080,
              protocol: 'HTTP',
            },
          ],
        },
      };

      req.body = validGateway;
      
      await validateGateway(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(); // Called without error
      expect(req.body).toEqual(validGateway);
    });

    it('should reject invalid gateway configuration', async () => {
      const invalidGateway = {
        name: '', // Empty name
        namespace: 'default',
        spec: {
          gatewayClassName: 'test-class',
          listeners: [], // Empty listeners
        },
      };

      req.body = invalidGateway;
      
      expect(() => validateGateway(req as Request, res as Response, next))
        .toThrow(ValidationError);
    });
  });

  describe('HTTPRoute Validation', () => {
    it('should pass valid HTTPRoute configuration', async () => {
      const validRoute = {
        name: 'test-route',
        namespace: 'default',
        parentRefs: [
          {
            name: 'test-gateway',
          },
        ],
        rules: [
          {
            backendRefs: [
              {
                name: 'test-service',
                port: 8080,
              },
            ],
          },
        ],
      };

      req.body = validRoute;
      
      await validateHTTPRoute(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(); // Called without error
      expect(req.body).toEqual(validRoute);
    });

    it('should reject invalid HTTPRoute configuration', async () => {
      const invalidRoute = {
        name: 'test-route',
        namespace: 'default',
        parentRefs: [], // Empty parent refs
        rules: [], // Empty rules
      };

      req.body = invalidRoute;
      
      expect(() => validateHTTPRoute(req as Request, res as Response, next))
        .toThrow(ValidationError);
    });
  });
});
