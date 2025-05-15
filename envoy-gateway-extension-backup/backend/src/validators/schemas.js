const Joi = require('joi');

// Gateway Schemas
const listenerSchema = Joi.object({
  name: Joi.string().required(),
  hostname: Joi.string().optional(),
  protocol: Joi.string().valid('HTTP', 'HTTPS', 'TLS', 'GRPC').required(),
  port: Joi.number().integer().min(1).max(65535).required(),
  allowedRoutes: Joi.object().optional(),
  tls: Joi.object({
    mode: Joi.string().valid('Terminate', 'Passthrough').optional(),
    certificateRefs: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        namespace: Joi.string().optional()
      })
    ).optional()
  }).optional()
});

const gatewaySchema = Joi.object({
  name: Joi.string().pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/).required(),
  namespace: Joi.string().optional(),
  gatewayClassName: Joi.string().default('envoy-gateway'),
  listeners: Joi.array().items(listenerSchema).min(1).required(),
  labels: Joi.object().pattern(Joi.string(), Joi.string()).optional()
});

// HTTPRoute Schemas
const routeMatchSchema = Joi.object({
  path: Joi.object({
    type: Joi.string().valid('Exact', 'PathPrefix', 'RegularExpression').default('PathPrefix'),
    value: Joi.string().required()
  }).optional(),
  headers: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('Exact', 'RegularExpression').optional(),
      value: Joi.string().required()
    })
  ).optional(),
  queryParams: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('Exact', 'RegularExpression').optional(),
      value: Joi.string().required()
    })
  ).optional()
});

const backendRefSchema = Joi.object({
  name: Joi.string().required(),
  namespace: Joi.string().optional(),
  port: Joi.number().integer().min(1).max(65535).required(),
  weight: Joi.number().integer().min(1).max(1000000).default(1),
  kind: Joi.string().default('Service')
});

const routeFilterSchema = Joi.object({
  type: Joi.string().valid(
    'RequestHeaderModifier',
    'ResponseHeaderModifier',
    'RequestRedirect',
    'URLRewrite'
  ).required(),
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
  }).when('type', { is: 'RequestHeaderModifier', then: Joi.required() }),
  requestRedirect: Joi.object({
    scheme: Joi.string().valid('http', 'https').optional(),
    hostname: Joi.string().optional(),
    path: Joi.object({
      type: Joi.string().valid('ReplaceFullPath', 'ReplacePrefixMatch').required(),
      replaceFullPath: Joi.string().when('type', { is: 'ReplaceFullPath', then: Joi.required() }),
      replacePrefixMatch: Joi.string().when('type', { is: 'ReplacePrefixMatch', then: Joi.required() })
    }).optional(),
    port: Joi.number().integer().min(1).max(65535).optional(),
    statusCode: Joi.number().integer().valid(301, 302).default(302)
  }).when('type', { is: 'RequestRedirect', then: Joi.required() })
});

const routeRuleSchema = Joi.object({
  matches: Joi.array().items(routeMatchSchema).min(1).required(),
  backendRefs: Joi.array().items(backendRefSchema).optional(),
  filters: Joi.array().items(routeFilterSchema).optional()
});

const httpRouteSchema = Joi.object({
  name: Joi.string().pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/).required(),
  namespace: Joi.string().optional(),
  parentRefs: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      namespace: Joi.string().optional(),
      kind: Joi.string().default('Gateway'),
      group: Joi.string().default('gateway.networking.k8s.io'),
      sectionName: Joi.string().optional()
    })
  ).min(1).required(),
  hostnames: Joi.array().items(Joi.string().hostname()).optional(),
  rules: Joi.array().items(routeRuleSchema).min(1).required(),
  labels: Joi.object().pattern(Joi.string(), Joi.string()).optional()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    req.validatedBody = value;
    next();
  };
};

module.exports = {
  gatewaySchema,
  httpRouteSchema,
  listenerSchema,
  validate
};