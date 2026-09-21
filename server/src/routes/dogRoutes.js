import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { listDogs, getDog, getHistory, search, removeDog, relocateDog } from '../controllers/dogController.js';

const router = Router();

router.use(requireAuth);

router.get('/search', search);
router.get('/', listDogs);
router.get('/:dogId', getDog);
router.get('/:dogId/history', getHistory);
router.delete('/:dogId', removeDog);
router.post('/:dogId/relocate', relocateDog);

export default router;
