import { getRecentSightings, getAllSightings } from '../services/supabasePersistenceService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const recentSightings = asyncHandler(async (req, res) => {
  const limitCount = Number(req.query.limit) || 8;
  const sightings = await getRecentSightings(limitCount);
  res.json({ sightings, count: sightings.length });
});

export const allSightings = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const sightings = await getAllSightings({ from, to });
  res.json({ sightings, count: sightings.length });
});
