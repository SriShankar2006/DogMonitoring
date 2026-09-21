import { getDashboardStats, getFullStats } from '../services/supabasePersistenceService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardStats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  res.json(stats);
});

export const fullStats = asyncHandler(async (req, res) => {
  const range = req.query.range || 'month';
  const stats = await getFullStats(range);
  res.json(stats);
});
