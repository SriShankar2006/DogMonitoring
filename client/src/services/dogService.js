import api from './api';

export const dogService = {
  getAllDogs: (params = {}) => api.get('/dogs', { params }).then((r) => r.data),

  getDogById: (dogId) => api.get(`/dogs/${dogId}`).then((r) => r.data),

  getDogHistory: (dogId) => api.get(`/dogs/${dogId}/history`).then((r) => r.data),

  searchDogs: (params) => api.get('/dogs/search', { params }).then((r) => r.data),

  deleteDog: (dogId) => api.delete(`/dogs/${dogId}`).then((r) => r.data),

  relocateDog: (dogId, payload) => api.post(`/dogs/${dogId}/relocate`, payload).then((r) => r.data),

  getRecentUploads: (limitCount = 8) =>
    api.get('/sightings/recent', { params: { limit: limitCount } }).then((r) => r.data),

  getAllSightings: (params = {}) => api.get('/sightings', { params }).then((r) => r.data)
};

export const statsService = {
  getDashboardStats: () => api.get('/stats/dashboard').then((r) => r.data),
  getFullStats: (range = 'month') =>
    api.get('/stats', { params: { range } }).then((r) => r.data)
};
