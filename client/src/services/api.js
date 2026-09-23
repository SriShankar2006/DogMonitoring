import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
});

// The server (and the underlying Supabase tables / demo store) return
// snake_case keys (dog_id, latest_latitude, image_url, ...) while every
// component in this app was written expecting camelCase (dogId,
// latestLatitude, imageUrl, ...). Rather than touching every controller and
// every Supabase column, normalize the shape once here so the rest of the
// app can rely on camelCase consistently.
function snakeToCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function camelizeKeys(value) {
  if (Array.isArray(value)) {
    return value.map(camelizeKeys);
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.entries(value).reduce((acc, [k, v]) => {
      acc[snakeToCamel(k)] = camelizeKeys(v);
      return acc;
    }, {});
  }
  return value;
}

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      response.data = camelizeKeys(response.data);
    }
    return response;
  },
  (error) => {
    const message =
      error?.response?.data?.message || error.message || 'Something went wrong';
    const wrapped = new Error(message);
    // Preserve status + response payload so callers can branch on specific
    // cases (e.g. 422 "no dog detected" from the upload endpoint) without
    // having to re-parse the original axios error.
    wrapped.status = error?.response?.status ?? null;
    wrapped.data = error?.response?.data ?? null;
    return Promise.reject(wrapped);
  }
);

export default api;
