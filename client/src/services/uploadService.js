import api from './api';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';

/**
 * Full client-side upload workflow:
 * 1. Get GPS position
 * 2. Reverse geocode to a readable address
 * 3. Send the image + metadata to the backend, which validates the image is a
 *    dog via the AI API, runs duplicate detection, uploads to Supabase, and
 *    writes to Firestore (Dogs + SightingHistory collections).
 */
export async function uploadDogSighting(file, onProgress, clientConfidence) {
  const { latitude, longitude } = await getCurrentPosition();
  const address = await reverseGeocode(latitude, longitude);

  const formData = new FormData();
  formData.append('image', file);
  formData.append('latitude', latitude);
  formData.append('longitude', longitude);
  formData.append('address', address);
  formData.append('capturedAt', new Date().toISOString());
  // Real confidence from the browser-side TFLite dog-detection check (see
  // utils/dogDetector.js) - lets the server report the actual score instead
  // of a hardcoded demo value when no external AI_API_URL is configured.
  if (typeof clientConfidence === 'number') {
    formData.append('clientConfidence', clientConfidence);
  }

  const response = await api.post('/upload', formData, {
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    }
  });

  return response.data;
}
