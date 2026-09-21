import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { dashboardStats, fullStats } from '../controllers/statsController.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', dashboardStats);
router.get('/', fullStats);

export default router;
