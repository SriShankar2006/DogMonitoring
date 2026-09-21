import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { uploadImage } from '../middleware/uploadMiddleware.js';
import { handleUpload } from '../controllers/uploadController.js';

const router = Router();

// Local laptop/server testing: accept uploads from any device on the network
// without requiring Firebase auth in the request. Production can tighten this
// later by setting ALLOW_UNAUTHENTICATED_UPLOADS=false.
router.post('/', requireAuth, uploadImage, handleUpload);

export default router;
