import { detectDog, extractEmbedding } from '../services/aiService.js';
import { uploadSightingImage } from '../services/storageService.js';
import {
  recordSighting,
  persistSightingRecords
} from '../services/supabasePersistenceService.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';
import { scoreReidCandidates } from '../services/reidService.js';
import { hashImageBuffer, savePostgresEmbedding } from '../services/postgresReidService.js';

/**
 * Full server-side upload workflow (see README "Core Workflow"):
 * 1. multer (uploadMiddleware) has already validated the file is JPG/PNG.
 * 2. Send the image to the AI API.
 * 3. isDog=false -> reject with 422.
 * 4. isDog=true  -> resolve dogId (new or duplicate), upload image to
 *    Supabase, write Dogs + SightingHistory records to Firestore.
 */
export const handleUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file was provided.');
  }

  const { latitude, longitude, address, capturedAt, clientConfidence, timestamp } = req.body;

  if (!latitude || !longitude) {
    throw new ApiError(400, 'GPS latitude/longitude is required.');
  }

  const finalCapturedAt = capturedAt || timestamp || new Date().toISOString();
  const parsedConfidence = clientConfidence !== undefined ? Number(clientConfidence) : undefined;
  const aiResult = await detectDog(req.file.buffer, req.file.originalname, req.file.mimetype, parsedConfidence);

  if (!aiResult.isDog) {
    return res.status(422).json({
      message: 'No dog detected in the uploaded image.',
      isDog: false,
      confidence: aiResult.confidence
    });
  }

  const reidEmbedding = await extractEmbedding(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );
  const reidResult = await scoreReidCandidates({
    latitude,
    longitude,
    embedding: reidEmbedding.embedding,
    imageHash: hashImageBuffer(req.file.buffer),
    capturedAt: finalCapturedAt
  });
  const matchedDogId = ['LIKELY_SAME', 'ALREADY_UPLOADED'].includes(reidResult.decision)
    ? reidResult.matchedDogId
    : null;

  if (matchedDogId) {
    aiResult.isDuplicate = true;
    aiResult.dogId = matchedDogId;
  }

  const { sightingId, dogId, isNewDog, isoDate, isoTime, capturedDate } = await recordSighting({
    aiResult,
    latitude,
    longitude,
    address,
    capturedAt: finalCapturedAt
  });

  const imageUrl = await uploadSightingImage({
    buffer: req.file.buffer,
    mimeType: req.file.mimetype,
    dogId,
    sightingId
  });

  const { dog } = await persistSightingRecords({
    dogId,
    sightingId,
    isNewDog,
    imageUrl,
    latitude: Number(latitude),
    longitude: Number(longitude),
    address,
    isoDate,
    isoTime,
    capturedDate,
    confidence: aiResult.confidence,
    uploadedBy: req.user?.uid
  });

  await savePostgresEmbedding({
    dogId,
    imageName: req.file.originalname,
    imageBuffer: req.file.buffer,
    embedding: reidEmbedding.embedding,
    modelName: reidEmbedding.modelName
  });

  res.status(201).json({
    message: isNewDog ? 'New dog registered successfully.' : 'Sighting added to existing dog.',
    isDog: true,
    isNewDog,
    isDuplicate: !isNewDog,
    isAlreadyUploaded: reidResult.decision === 'ALREADY_UPLOADED',
    matchedDogId,
    confidence: aiResult.confidence,
    reidDecision: reidResult.decision,
    reidSimilarity: reidResult.topCandidate?.visual_score ?? null,
    dog,
    sightingId
  });
});
