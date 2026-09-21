import { auth, isFirebaseConfigured } from '../config/firebaseAdmin.js';
import { ApiError } from '../utils/asyncHandler.js';

const allowUnauthenticatedUploads = String(process.env.ALLOW_UNAUTHENTICATED_UPLOADS || 'true').toLowerCase() === 'true';

/**
 * For the laptop-as-local-server workflow, uploads should work from any device
 * on the same network without forcing a Firebase session. If Firebase is
 * configured and a bearer token exists, we still verify it. Otherwise, we
 * allow the request to continue when this explicit local-testing mode is on.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (token) {
      if (!isFirebaseConfigured) {
        req.user = { uid: 'demo-user', email: 'demo@example.com' };
        return next();
      }

      const decoded = await auth.verifyIdToken(token);
      req.user = { uid: decoded.uid, email: decoded.email };
      return next();
    }

    if (!isFirebaseConfigured || allowUnauthenticatedUploads) {
      req.user = { uid: 'local-device-user', email: 'local-device@example.com' };
      return next();
    }

    throw new ApiError(401, 'Missing authentication token.');
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired authentication token.'));
  }
}
