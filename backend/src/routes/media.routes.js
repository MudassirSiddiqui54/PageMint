import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { imagekitAuthParameters } from '../services/imagekit.js';

const router = Router();
router.get('/imagekit-auth', requireAuth, asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(imagekitAuthParameters());
}));
export default router;
