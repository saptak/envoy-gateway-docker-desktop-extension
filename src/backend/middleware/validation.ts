import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../../shared/types';

// Common schemas
const nameSchema = Joi.string().min(1).max(63).pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
const namespaceSchema = Joi.string().min(1).max(63).pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);

// Gateway schema
const gatewaySchema = Joi.object({
  name: nameSchema.required(),
  namespace: namespaceSchema.required(),
  spec: Joi.object({
    gatewayClassName: Joi.string().required(),
    listeners: Joi.array().items(
      Joi.object({
        name: nameSchema.required(),
        hostname: Joi.string().optional(),
        port: Joi.number().integer().min(1).max(65535).required(),
        protocol: Joi.string().valid('HTTP', 'HTTPS', 'TLS', 'TCP', 'UDP').required(),
        tls: Joi.object({
          mode: Joi.string().valid('Terminate', 'Passthrough').optional(),
          certificateRefs: Joi.array().items(
            Joi.object({
              name: nameSchema.required(),
              namespace: namespaceSchema.optional(),
              kind: Joi.string().optional(),
              group: Joi.string().optional(),
            })
          ).optional(),
          options: Joi.object().optional(),
        }).optional(),
        allowedRoutes: Joi.object({
          namespaces: Joi.object({
            from: Joi.string().valid('All', 'Selector', 'Same').required(),
            selector: Joi.object().optional(),
          }).optional(),
          kinds: Joi.array().items(
            Joi.object({
              group: Joi.string().optional(),
              kind: Joi.string().required(),
            })
          ).optional(),
        }).optional(),
      })
    ).min(1).required(),
    addresses: Joi.array().items(
      Joi.object({
        type: Joi.string().optional(),
        value: Joi.string().required(),
      })
    ).optional(),
  }).required(),
});

// HTTPRoute schema
const httpRouteSchema = Joi.object({
  name: nameSchema.required(),
  namespace: namespaceSchema.required(),
  parentRefs: Joi.array().items(
    Joi.object({
      group: Joi.string().optional(),
      kind: Joi.string().optional(),
      namespace: namespaceSchema.optional(),
      name: nameSchema.required(),
      sectionName: Joi.string().optional(),
      port: Joi.number().integer().min(1).max(65535).optional(),
    })
  ).min(1).required(),
  hostnames: Joi.array().items(Joi.string()).optional(),
  rules: Joi.array().items(
    Joi.object({
      matches: Joi.array().items(
        Joi.object({
          path: Joi.object({
            type: Joi.string().valid('Exact', 'PathPrefix', 'RegularExpression').required(),
            value: Joi.string().required(),
          }).optional(),
          headers: Joi.array().items(
            Joi.object({
              type: Joi.string().valid('Exact', 'RegularExpression').optional(),
              name: Joi.string().required(),
              value: Joi.string().required(),
            })
          ).optional(),
          queryParams: Joi.array().items(
            Joi.object({
              type: Joi.string().valid('Exact', 'RegularExpression').optional(),
              name: Joi.string().required(),
              value: Joi.string().required(),
            })
          ).optional(),
          method: Joi.string().valid('GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH').optional(),
        })
      ).optional(),
      filters: Joi.array().items(
        Joi.object({
          type: Joi.string().valid('RequestHeaderModifier', 'ResponseHeaderModifier', 'RequestMirror', 'RequestRedirect', 'URLRewrite', 'ExtensionRef').required(),
          requestHeaderModifier: Joi.object({
            set: Joi.array().items(
              Joi.object({
                name: Joi.string().required(),
                value: Joi.string().required(),
              })
            ).optional(),
            add: Joi.array().items(
              Joi.object({
                name: Joi.string().required(),
                value: Joi.string().required(),
              })
            ).optional(),
            remove: Joi.array().items(Joi.string()).optional(),
          }).optional(),
          responseHeaderModifier: Joi.object({
            set: Joi.array().items(
              Joi.object({
                name: Joi.string().required(),
                value: Joi.string().required(),
              })
            ).optional(),
            add: Joi.array().items(
              Joi.object({
                name: Joi.string().required(),
                value: Joi.string().required(),
              })
            ).optional(),
            remove: Joi.array().items(Joi.string()).optional(),
          }).optional(),
          requestMirror: Joi.object({
            backendRef: Joi.object({
              name: nameSchema.required(),
              namespace: namespaceSchema.optional(),
              port: Joi.number().integer().min(1).max(65535).optional(),
            }).required(),
          }).optional(),
          requestRedirect: Joi.object({
            scheme: Joi.string().optional(),
            hostname: Joi.string().optional(),
            path: Joi.object({
              type: Joi.string().valid('ReplaceFullPath', 'ReplacePrefixMatch').required(),
              replaceFullPath: Joi.string().optional(),
              replacePrefixMatch: Joi.string().optional(),
            }).optional(),
            port: Joi.number().integer().min(1).max(65535).optional(),
            statusCode: Joi.number().integer().min(300).max(399).optional(),
          }).optional(),
          urlRewrite: Joi.object({
            hostname: Joi.string().optional(),
            path: Joi.object({
              type: Joi.string().valid('ReplaceFullPath', 'ReplacePrefixMatch').required(),
              replaceFullPath: Joi.string().optional(),
              replacePrefixMatch: Joi.string().optional(),
            }).optional(),
          }).optional(),
          extensionRef: Joi.object({
            name: nameSchema.required(),
          }).optional(),
        })
      ).optional(),
      backendRefs: Joi.array().items(
        Joi.object({
          name: nameSchema.required(),
          namespace: namespaceSchema.optional(),
          port: Joi.number().integer().min(1).max(65535).optional(),
          weight: Joi.number().integer().min(0).max(1000000).optional(),
          filters: Joi.array().optional(),
        })
      ).optional(),
      timeouts: Joi.object({
        request: Joi.string().pattern(/^\d+(\.\d+)?(ms|s|m|h)$/).optional(),
        backendRequest: Joi.string().pattern(/^\d+(\.\d+)?(ms|s|m|h)$/).optional(),
      }).optional(),
    })
  ).min(1).required(),
});

// YAML configuration schema
const yamlConfigSchema = Joi.string().min(1).required();

// Query parameter schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
});

const namespaceQuerySchema = Joi.object({
  namespace: namespaceSchema.optional(),
});

// Route parameter schemas
const routeParamsSchema = Joi.object({
  name: nameSchema.required(),
  namespace: namespaceSchema.required(),
});

// Create validation middleware factory
function createValidationMiddleware(schema: Joi.Schema, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      throw new ValidationError(`Validation failed: ${error.message}`, details);
    }

    // Replace the source data with validated and converted values
    if (source === 'body') {
      req.body = value;
    } else if (source === 'params') {
      req.params = value;
    } else if (source === 'query') {
      req.query = value;
    }

    next();
  };
}

// Export validation middleware functions
export const validateGateway = createValidationMiddleware(gatewaySchema, 'body');
export const validateHTTPRoute = createValidationMiddleware(httpRouteSchema, 'body');
export const validateYamlConfig = createValidationMiddleware(yamlConfigSchema, 'body');
export const validateRouteParams = createValidationMiddleware(routeParamsSchema, 'params');
export const validatePagination = createValidationMiddleware(paginationSchema, 'query');
export const validateNamespaceQuery = createValidationMiddleware(namespaceQuerySchema, 'query');

// Generic validation middleware that passes through if no schema is specified
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  // This middleware doesn't validate anything by default
  // It's used as a placeholder and for future enhancements
  next();
}

// Validate Kubernetes resource names
export function validateKubernetesName(name: string): boolean {
  return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name) && name.length <= 63;
}

// Validate namespace name
export function validateNamespaceName(namespace: string): boolean {
  return validateKubernetesName(namespace);
}

// Validate port number
export function validatePort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

// Validate DNS hostname
export function validateHostname(hostname: string): boolean {
  return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(hostname);
}

// Validate HTTP method
export function validateHTTPMethod(method: string): boolean {
  const validMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'];
  return validMethods.includes(method.toUpperCase());
}

// Sanitize string input
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// Validate and sanitize gateway input
export function validateAndSanitizeGateway(gateway: any): any {
  // Sanitize string fields
  if (gateway.name) gateway.name = sanitizeString(gateway.name);
  if (gateway.namespace) gateway.namespace = sanitizeString(gateway.namespace);
  
  // Validate gateway class name
  if (gateway.spec?.gatewayClassName) {
    gateway.spec.gatewayClassName = sanitizeString(gateway.spec.gatewayClassName);
  }

  return gateway;
}

// Validate and sanitize route input
export function validateAndSanitizeRoute(route: any): any {
  // Sanitize string fields
  if (route.name) route.name = sanitizeString(route.name);
  if (route.namespace) route.namespace = sanitizeString(route.namespace);
  
  // Sanitize hostnames
  if (route.hostnames && Array.isArray(route.hostnames)) {
    route.hostnames = route.hostnames.map((hostname: string) => sanitizeString(hostname));
  }

  return route;
}

export default validateRequest;
