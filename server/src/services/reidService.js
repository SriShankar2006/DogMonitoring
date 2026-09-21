import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { isPostgresConfigured } from '../config/postgres.js';
import { findPostgresImageByHash, listPostgresReidCandidates } from './postgresReidService.js';
import { ApiError } from '../utils/asyncHandler.js';

const WEIGHTS = {
  visual: Number(process.env.REID_VISUAL_WEIGHT ?? 0.7),
  geo: Number(process.env.REID_GEO_WEIGHT ?? 0.2),
  temporal: Number(process.env.REID_TEMPORAL_WEIGHT ?? 0.1)
};

const RADIUS_METERS = Number(process.env.REID_RADIUS_METERS ?? 100);
const MATCH_THRESHOLD = Number(process.env.REID_MATCH_THRESHOLD ?? 0.75);
const AMBIGUOUS_MARGIN = Number(process.env.REID_AMBIGUOUS_MARGIN ?? 0.05);

function normalizeValue(value, min, max) {
  if (!Number.isFinite(value)) return 0;
  if (max <= min) return 0;
  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

function computeGeoScore(distanceMeters) {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return 1;
  return 1 - Math.min(distanceMeters / RADIUS_METERS, 1);
}

function computeTemporalScore(candidateTime, queryTime) {
  if (!candidateTime || !queryTime) return 0.5;
  const diffMs = Math.abs(new Date(queryTime).getTime() - new Date(candidateTime).getTime());
  const maxAgeMs = 1000 * 60 * 60 * 24 * 30;
  return 1 - Math.min(diffMs / maxAgeMs, 1);
}

export async function findReidCandidates({ latitude, longitude, embedding }) {
  const postgresCandidates = await listPostgresReidCandidates(embedding);
  if (isPostgresConfigured()) return postgresCandidates;

  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('find_reid_candidates', {
      query_lat: Number(latitude),
      query_lng: Number(longitude),
      query_embedding: embedding,
      radius_meters: RADIUS_METERS
    });

    if (error) {
      const message = error.message || '';
      if (/could not find the function|function .* not found|does not exist/i.test(message)) {
        console.warn('Supabase re-ID RPC is missing; continuing without re-ID candidates to allow uploads to proceed.');
        return [];
      }
      throw new ApiError(500, `Re-ID lookup failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    if (error instanceof ApiError && /Re-ID lookup failed:/.test(error.message)) {
      console.warn(`${error.message} Falling back to no candidate matches.`);
      return [];
    }
    throw error;
  }
}

export async function scoreReidCandidates({ latitude, longitude, embedding, imageHash, capturedAt }) {
  const exactImage = await findPostgresImageByHash(imageHash);
  if (exactImage) {
    return {
      decision: 'ALREADY_UPLOADED',
      matchedDogId: exactImage.dog_id,
      matchedSightingId: null,
      topCandidate: { ...exactImage, visual_score: 1, combined_score: 1 },
      scoredCandidates: []
    };
  }

  const candidates = await findReidCandidates({ latitude, longitude, embedding });

  const queryTime = capturedAt ? new Date(capturedAt).getTime() : Date.now();

  const scored = candidates.map((candidate) => {
    const geoScore = computeGeoScore(Number(candidate.distance_meters ?? 0));
    const visualScore = Number(candidate.visual_similarity ?? 0);
    const temporalScore = computeTemporalScore(candidate.captured_at || candidate.created_at, queryTime);
    const combined = (
      WEIGHTS.visual * visualScore +
      WEIGHTS.geo * geoScore +
      WEIGHTS.temporal * temporalScore
    );

    return {
      ...candidate,
      geo_score: geoScore,
      temporal_score: temporalScore,
      visual_score: visualScore,
      combined_score: combined
    };
  }).sort((a, b) => (b.combined_score ?? 0) - (a.combined_score ?? 0));

  if (!scored.length) {
    return {
      decision: 'NEW_DOG',
      matchedDogId: null,
      matchedSightingId: null,
      topCandidate: null,
      scoredCandidates: []
    };
  }

  const top = scored[0];
  const runnerUp = scored[1] || null;
  const margin = runnerUp ? top.combined_score - runnerUp.combined_score : 1;

  if (top.combined_score < MATCH_THRESHOLD) {
    return {
      decision: top.combined_score >= MATCH_THRESHOLD * 0.7 ? 'POSSIBLE_MATCH' : 'NEW_DOG',
      matchedDogId: null,
      matchedSightingId: null,
      topCandidate: top,
      scoredCandidates: scored
    };
  }

  if (runnerUp && margin < AMBIGUOUS_MARGIN) {
    return {
      decision: 'AMBIGUOUS',
      matchedDogId: null,
      matchedSightingId: null,
      topCandidate: top,
      scoredCandidates: scored
    };
  }

  return {
    decision: 'LIKELY_SAME',
    matchedDogId: top.dog_id,
    matchedSightingId: top.sighting_id,
    topCandidate: top,
    scoredCandidates: scored
  };
}
