import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const hasFirebaseCredentials = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
);

if (!admin.apps.length && hasFirebaseCredentials) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });
}

export const isFirebaseConfigured = hasFirebaseCredentials;
export const auth = isFirebaseConfigured
  ? admin.auth()
  : { verifyIdToken: async () => ({ uid: 'demo-user', email: 'demo@example.com' }) };
export const db = isFirebaseConfigured ? admin.firestore() : null;
export const FieldValue = isFirebaseConfigured ? admin.firestore.FieldValue : null;
export const Timestamp = isFirebaseConfigured ? admin.firestore.Timestamp : null;

export default admin;
