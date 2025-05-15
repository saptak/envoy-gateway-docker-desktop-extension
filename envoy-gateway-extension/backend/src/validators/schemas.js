const Joi = require('joi');

// Gateway validation schema
const gatewaySchema = Joi.object({
  name: Joi.string().required().pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/).max(63),
  namespace: Joi.string().pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/).max(63).default('default'),
  gatewayClassName: Joi.string().default('envoy-gateway'),
  listeners: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      protocol: Joi.string().valid('HTTP', 'HTTPS', 'TLS', 'TCP', 'UDP').required(),
      port: Joi.number().integer().min(1).max(65535).required(),
      hostname: Joi.string().optional(),
      tls: Joi.object({
        mode: Joi.string().valid('Terminate', 'Passthrough').default('Terminate'),
        certificateRefs: Joi.array().items(
          Joi.object({
            kind: Joi.string().default('Secret'),
            name: Joi.string().required(),
            namespace: Joi.string().optional()
          })
        ).optional()
      }).optional()
    })
  ).min(1).required()
});

// HTTPRoute validation schema
const httpRouteSchema = Joi.object({
  name: Joi.string().required().pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/).max(63),
  namespace: Joi.string().pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/).max(63).default('default'),
  parentRefs: Joi.array().items(
    Joi.object({
      group: Joi.string().default('gateway.networking.k8s.io'),
      kind: Joi.string().default('Gateway'),
      name: Joi.string().required(),
      namespace: Joi.string().optional(),
      sectionName: Joi.string().optional()
    })
  ).min(1).required(),
  hostnames: Joi.array().items(Joi.string().hostname()).optional(),
  rules: Joi.array().items(
    Joi.object({
      matches: Joi.array().items(
        Joi.object({
          path: Joi.object({
            type: Joi.string().valid('Exact', 'PathPrefix', 'RegularExpression').default('PathPrefix'),
            value: Joi.string().required()
          }).optional(),
          headers: Joi.array().items(
            Joi.object({
              type: Joi.string().valid('Exact', 'RegularExpression').default('Exact'),
              name: Joi.string().required(),
              value: Joi.string().required()
            })
          ).optional(),
          queryParams: Joi.array().items(
            Joi.object({
              type: Joi.string().valid('Exact', 'RegularExpression').default('Exact'),
              name: Joi.string().required(),
              value: Joi.string().required()
            })
          ).optional(),
          method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS').optional()
        })
      ).optional(),
      filters: Joi.array().items(
        Joi.object({
          type: Joi.string().valid('RequestHeaderModifier', 'ResponseHeaderModifier', 'RequestRedirect', 'URLRewrite').required(),
          requestHeaderModifier: Joi.object({
            set: Joi.array().items(
              Joi.object({
                name: Joi.string().required(),
                value: Joi.string().required()
              })
            ).optional(),
            add: Joi.array().items(
              Joi.object({
                name: Joi.string().required(),
                value: Joi.string().required()
              })
            ).optional(),
            remove: Joi.array().items(Joi.string()).optional()
          }).optional(),
          responseHeaderModifier: Joi.object({
            set: Joi.array().items(
              Joi.object({
                name: Joi.string().required(),
                value: Joi.string().required()
              })
            ).optional(),
            add: Joi.array().items(
              Joi.object({
                name: Joi.string().required(),
                value: Joi.string().required()
              })
            ).optional(),
            remove: Joi.array().items(Joi.string()).optional()
          }).optional(),
          requestRedirect: Joi.object({
            scheme: Joi.string().valid('http', 'https').optional(),
            hostname: Joi.string().hostname().optional(),
            path: Joi.object({
              type: Joi.string().valid('ReplaceFullPath', 'ReplacePrefixMatch').required(),
              replaceFullPath: Joi.string().optional(),
              replacePrefixMatch: Joi.string().optional()
            }).optional(),
            port: Joi.number().integer().min(1).max(65535).optional(),
            statusCode: Joi.number().valid(301, 302).default(302)
          }).optional(),
          urlRewrite: Joi.object({
            hostname: Joi.string().hostname().optional(),
            path: Joi.object({
              type: Joi.string().valid('ReplaceFullPath', 'ReplacePrefixMatch').required(),
              replaceFullPath: Joi.string().optional(),
              replacePrefixMatch: Joi.string().optional()
            }).optional()
          }).optional()
        })
      ).optional(),
      backendRefs: Joi.array().items(
        Joi.object({
          group: Joi.string().default(''),
          kind: Joi.string().default('Service'),
          name: Joi.string().required(),
          namespace: Joi.string().optional(),
          port: Joi.number().integer().min(1).max(65535).required(),
          weight: Joi.number().integer().min(0).max(1000000).default(1)
        })
      ).min(1).required()
    })
  ).min(1).required()
});

// Gateway update schema (allows partial updates)
const gatewayUpdateSchema = gatewaySchema.fork(['name'], (schema) => schema.optional());

// HTTPRoute update schema (allows partial updates)
const httpRouteUpdateSchema = httpRouteSchema.fork(['name'], (schema) => schema.optional());

// Query parameters schema
const listQuerySchema = Joi.object({
  namespace: Joi.string().pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/).max(63).optional(),
  labelSelector: Joi.string().optional(),
  fieldSelector: Joi.string().optional()
});

module.exports = {
  gatewaySchema,
  httpRouteSchema,
  gatewayUpdateSchema,
  httpRouteUpdateSchema,
  listQuerySchema
};