import express from 'express';
import { ruleService } from '../services/ruleService';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(createRateLimiter('api'));

// Get all rules
router.get('/', requirePermission('rule:read'), async (req: AuthRequest, res) => {
  try {
    const rules = await ruleService.getRules(req.user!.organization_id);
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get rule by ID
router.get('/:id', requirePermission('rule:read'), async (req: AuthRequest, res) => {
  try {
    const rule = await ruleService.getRule(req.params.id, req.user!.organization_id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create rule
router.post('/', requirePermission('rule:write'), validateRequest(schemas.rule), async (req: AuthRequest, res) => {
  try {
    const rule = await ruleService.createRule(req.body, req.user!.organization_id);
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update rule
router.put('/:id', requirePermission('rule:write'), async (req: AuthRequest, res) => {
  try {
    const rule = await ruleService.updateRule(req.params.id, req.body, req.user!.organization_id);
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete rule
router.delete('/:id', requirePermission('rule:delete'), async (req: AuthRequest, res) => {
  try {
    await ruleService.deleteRule(req.params.id, req.user!.organization_id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Toggle rule active status
router.patch('/:id/toggle', requirePermission('rule:write'), async (req: AuthRequest, res) => {
  try {
    const rule = await ruleService.getRule(req.params.id, req.user!.organization_id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const updatedRule = await ruleService.updateRule(req.params.id, {
      active: !rule.active
    }, req.user!.organization_id);

    res.json(updatedRule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;