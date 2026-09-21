import {
  getAllDogs,
  getDogById,
  getDogHistory,
  searchDogs,
  deleteDog,
  recordRelocation
} from '../services/supabasePersistenceService.js';
import { deleteDogImages } from '../services/storageService.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

export const listDogs = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const dogs = await getAllDogs({ from, to });
  res.json({ dogs, count: dogs.length });
});

export const getDog = asyncHandler(async (req, res) => {
  const dog = await getDogById(req.params.dogId);
  res.json({ dog });
});

export const getHistory = asyncHandler(async (req, res) => {
  const history = await getDogHistory(req.params.dogId);
  res.json({ history, count: history.length });
});

export const search = asyncHandler(async (req, res) => {
  const { dogId, date, location, filter } = req.query;
  const dogs = await searchDogs({ dogId, date, location, filter });
  res.json({ dogs, count: dogs.length });
});

// Only the user who originally uploaded a dog is allowed to delete it -
// deleteDog() enforces that ownership check and throws a 403 ApiError
// otherwise, which asyncHandler forwards to the error middleware.
export const removeDog = asyncHandler(async (req, res) => {
  const result = await deleteDog(req.params.dogId, req.user.uid);
  // Best-effort cleanup - never lets an image-storage hiccup block the
  // delete response, since the DB rows are already gone at this point.
  await deleteDogImages(req.params.dogId).catch(() => {});
  res.json({ message: 'Dog deleted successfully.', ...result });
});

// Lets any signed-in user log a fresh GPS location for a dog that's
// already known, without going through the photo/AI-detection flow again.
export const relocateDog = asyncHandler(async (req, res) => {
  const { latitude, longitude, address, capturedAt } = req.body;
  if (!latitude || !longitude) {
    throw new ApiError(400, 'GPS latitude/longitude is required.');
  }

  const { dog, sightingId } = await recordRelocation({
    dogId: req.params.dogId,
    latitude: Number(latitude),
    longitude: Number(longitude),
    address,
    capturedAt,
    uploadedBy: req.user.uid
  });

  res.status(201).json({ message: 'Location updated successfully.', dog, sightingId });
});
