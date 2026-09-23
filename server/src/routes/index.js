import { Router } from 'express';
import uploadRoutes from './uploadRoutes.js';
import dogRoutes from './dogRoutes.js';
import sightingRoutes from './sightingRoutes.js';
import statsRoutes from './statsRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'stray-dog-api' }));

router.use('/upload', uploadRoutes);
router.use('/dogs', dogRoutes);
router.use('/sightings', sightingRoutes);
router.use('/stats', statsRoutes);
router.use('/admin', adminRoutes);

export default router;
