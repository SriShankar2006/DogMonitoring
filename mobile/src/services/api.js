import axios from 'axios';

// Detect if running in browser or mobile
const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
const baseURL = isBrowser 
  ? 'http://localhost:5001/api'
  : 'http://192.168.28.214:5001/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
});

export default api;
