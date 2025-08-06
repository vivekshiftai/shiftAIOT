import express from 'express';
import { authService } from '../services/authService';
import { validateRequest, schemas } from '../middleware/validation';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Apply rate limiting to auth routes
router.use(createRateLimiter('auth'));

// Register
router.post('/register', validateRequest(schemas.user), async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Login
router.post('/login', validateRequest(schemas.login), async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const result = await authService.refreshToken(token);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

export default router;