/**
 * Retrieves the current GPS coordinates using the browser Geolocation API.
 * @returns {Promise<{latitude:number, longitude:number}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (err) => reject(new Error(err.message || 'Unable to retrieve location.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Reverse geocodes lat/lng into a human-readable address using OpenStreetMap
 * Nominatim, so the app no longer depends on Google Maps.
 */
export async function reverseGeocode(latitude, longitude) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude)
  });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: { 'User-Agent': 'DogMonitoringApp/1.0 (contact@example.com)' }
    });
    const data = await response.json();
    if (data?.display_name) {
      return data.display_name;
    }
  } catch (error) {
    // ignore and fall back
  }

  return 'Unknown location';
}
