import express from 'express';
import { deviceService } from '../services/deviceService';
import { ruleService } from '../services/ruleService';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(createRateLimiter('api'));

// Get all devices
router.get('/', requirePermission('device:read'), async (req: AuthRequest, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      type: req.query.type as string,
      search: req.query.search as string
    };

    const devices = await deviceService.getDevices(req.user!.organization_id, filters);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get device by ID
router.get('/:id', requirePermission('device:read'), async (req: AuthRequest, res) => {
  try {
    const device = await deviceService.getDevice(req.params.id, req.user!.organization_id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create device
router.post('/', requirePermission('device:write'), validateRequest(schemas.device), async (req: AuthRequest, res) => {
  try {
    const device = await deviceService.createDevice(req.body, req.user!.organization_id);
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update device
router.put('/:id', requirePermission('device:write'), async (req: AuthRequest, res) => {
  try {
    const device = await deviceService.updateDevice(req.params.id, req.body, req.user!.organization_id);
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete device
router.delete('/:id', requirePermission('device:delete'), async (req: AuthRequest, res) => {
  try {
    await deviceService.deleteDevice(req.params.id, req.user!.organization_id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update device status
router.patch('/:id/status', requirePermission('device:write'), async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    await deviceService.updateDeviceStatus(req.params.id, status, req.user!.organization_id);
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get device telemetry
router.get('/:id/telemetry', requirePermission('device:read'), async (req: AuthRequest, res) => {
  try {
    const timeRange = req.query.range as string || '1h';
    const telemetry = await deviceService.getTelemetryData(req.params.id, timeRange);
    res.json(telemetry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Post telemetry data
router.post('/:id/telemetry', createRateLimiter('telemetry'), async (req: AuthRequest, res) => {
  try {
    const telemetryData = {
      device_id: req.params.id,
      timestamp: req.body.timestamp || new Date().toISOString(),
      metrics: req.body.metrics
    };

    await deviceService.storeTelemetryData(telemetryData);
    
    // Evaluate rules for this telemetry data
    await ruleService.evaluateRules(req.params.id, {
      ...telemetryData,
      organization_id: req.user!.organization_id
    });

    res.status(201).json({ message: 'Telemetry data stored successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get device statistics
router.get('/stats/overview', requirePermission('device:read'), async (req: AuthRequest, res) => {
  try {
    const stats = await deviceService.getDeviceStats(req.user!.organization_id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;