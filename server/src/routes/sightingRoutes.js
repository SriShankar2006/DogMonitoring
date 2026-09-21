import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { recentSightings, allSightings } from '../controllers/sightingController.js';

const router = Router();

router.get('/recent', requireAuth, recentSightings);
router.get('/', requireAuth, allSightings);

export default router;
