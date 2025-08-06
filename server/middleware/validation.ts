import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  device: Joi.object({
    name: Joi.string().required().min(1).max(100),
    type: Joi.string().valid('sensor', 'actuator', 'gateway', 'controller').required(),
    location: Joi.string().required().min(1).max(200),
    protocol: Joi.string().valid('MQTT', 'HTTP', 'CoAP').required(),
    tags: Joi.array().items(Joi.string()).default([]),
    firmware: Joi.string().required(),
    config: Joi.object().default({})
  }),

  rule: Joi.object({
    name: Joi.string().required().min(1).max(100),
    description: Joi.string().max(500),
    active: Joi.boolean().default(true),
    conditions: Joi.array().items(Joi.object({
      type: Joi.string().valid('device_status', 'telemetry_threshold', 'time_based').required(),
      deviceId: Joi.string().when('type', {
        is: Joi.string().valid('device_status', 'telemetry_threshold'),
        then: Joi.required()
      }),
      metric: Joi.string().when('type', {
        is: 'telemetry_threshold',
        then: Joi.required()
      }),
      operator: Joi.string().valid('>', '<', '=', '>=', '<=').required(),
      value: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      logicOperator: Joi.string().valid('AND', 'OR').optional()
    })).min(1).required(),
    actions: Joi.array().items(Joi.object({
      type: Joi.string().valid('notification', 'device_control', 'webhook', 'log').required(),
      config: Joi.object().required()
    })).min(1).required()
  }),

  user: Joi.object({
    name: Joi.string().required().min(1).max(100),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('super_admin', 'org_admin', 'device_manager', 'operator', 'viewer').required(),
    permissions: Joi.array().items(Joi.string()).default([])
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};