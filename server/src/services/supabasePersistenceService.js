import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { ApiError } from '../utils/asyncHandler.js';

const DOGS_TABLE = 'dogs';
const SIGHTINGS_TABLE = 'sighting_history';
const COUNTERS_TABLE = 'counters';
const DEMO_STORE_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'demo-store.json');

const demoDogs = [];
const demoSightings = [];

function getDemoStore() {
  return { dogs: demoDogs, sightings: demoSightings };
}

async function loadDemoStore() {
  try {
    await fs.mkdir(path.dirname(DEMO_STORE_FILE), { recursive: true });
    const content = await fs.readFile(DEMO_STORE_FILE, 'utf8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.dogs)) {
      demoDogs.push(...parsed.dogs);
    }
    if (Array.isArray(parsed.sightings)) {
      demoSightings.push(...parsed.sightings);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Unable to load demo store file:', error);
    }
  }
}

async function saveDemoStore() {
  try {
    const payload = JSON.stringify({ dogs: demoDogs, sightings: demoSightings }, null, 2);
    await fs.writeFile(DEMO_STORE_FILE, payload, 'utf8');
  } catch (error) {
    console.error('Unable to save demo store file:', error);
  }
}

await loadDemoStore();

function cloneArray(items) {
  return items.map((item) => ({ ...item }));
}

// Also provide query helpers used by controllers

export async function getAllDogs({ from, to } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    const dogs = cloneArray(getDemoStore().dogs).sort((a, b) => new Date(b.latest_detected || 0) - new Date(a.latest_detected || 0));
    let filtered = dogs;
    if (from) {
      const fromDate = new Date(from).toISOString();
      filtered = filtered.filter((d) => d.latest_detected >= fromDate);
    }
    if (to) {
      const toDate = new Date(to).toISOString();
      filtered = filtered.filter((d) => d.latest_detected <= toDate);
    }
    return filtered;
  }

  const { data: dogs = [], error } = await supabase.from(DOGS_TABLE).select('*').order('latest_detected', { ascending: false });
  if (error) throw new ApiError(500, error.message);
  let filtered = dogs;
  if (from) {
    const fromDate = new Date(from).toISOString();
    filtered = filtered.filter((d) => d.latest_detected >= fromDate);
  }
  if (to) {
    const toDate = new Date(to).toISOString();
    filtered = filtered.filter((d) => d.latest_detected <= toDate);
  }
  return filtered;
}

export async function getDogById(dogId) {
  if (!isSupabaseConfigured || !supabase) {
    const dog = getDemoStore().dogs.find((entry) => entry.dog_id === dogId);
    if (!dog) throw new ApiError(404, `Dog ${dogId} not found.`);
    return dog;
  }

  const { data, error } = await supabase.from(DOGS_TABLE).select('*').eq('dog_id', dogId).single();
  if (error) throw new ApiError(404, `Dog ${dogId} not found.`);
  return data;
}

export async function getDogHistory(dogId) {
  if (!isSupabaseConfigured || !supabase) {
    return cloneArray(getDemoStore().sightings.filter((entry) => entry.dog_id === dogId));
  }

  const { data, error } = await supabase.from(SIGHTINGS_TABLE).select('*').eq('dog_id', dogId).order('captured_at', { ascending: false });
  if (error) throw new ApiError(500, error.message);
  return data;
}

export async function getRecentSightings(limitCount = 8) {
  if (!isSupabaseConfigured || !supabase) {
    return cloneArray(getDemoStore().sightings).slice(0, limitCount);
  }

  const { data, error } = await supabase.from(SIGHTINGS_TABLE).select('*').order('captured_at', { ascending: false }).limit(limitCount);
  if (error) throw new ApiError(500, error.message);
  return data;
}

export async function getAllSightings({ from, to } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    let sightings = cloneArray(getDemoStore().sightings);
    if (from) {
      const fromDate = new Date(from).toISOString();
      sightings = sightings.filter((s) => s.captured_at >= fromDate);
    }
    if (to) {
      const toDate = new Date(to).toISOString();
      sightings = sightings.filter((s) => s.captured_at <= toDate);
    }
    return sightings;
  }

  let query = supabase.from(SIGHTINGS_TABLE).select('*').order('captured_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw new ApiError(500, error.message);
  let sightings = data || [];
  if (from) {
    const fromDate = new Date(from).toISOString();
    sightings = sightings.filter((s) => s.captured_at >= fromDate);
  }
  if (to) {
    const toDate = new Date(to).toISOString();
    sightings = sightings.filter((s) => s.captured_at <= toDate);
  }
  return sightings;
}

export async function searchDogs({ dogId, date, location, filter }) {
  if (!isSupabaseConfigured || !supabase) {
    const { dogs, sightings } = getDemoStore();
    let filtered = cloneArray(dogs);

    if (dogId) {
      const needle = dogId.trim().toUpperCase();
      filtered = filtered.filter((d) => d.dog_id?.toUpperCase().includes(needle));
    }

    if (location) {
      const needle = location.trim().toLowerCase();
      const matchingIds = new Set(sightings.filter((s) => (s.address || '').toLowerCase().includes(needle)).map((s) => s.dog_id));
      filtered = filtered.filter((d) => matchingIds.has(d.dog_id) || (d.latest_address || '').toLowerCase().includes(needle));
    }

    if (date) {
      const matchingIds = new Set(sightings.filter((s) => s.date === date).map((s) => s.dog_id));
      filtered = filtered.filter((d) => matchingIds.has(d.dog_id));
    }

    const now = new Date();
    if (filter === 'today') {
      filtered = filtered.filter((d) => new Date(d.latest_detected) >= new Date(now.getTime() - 24 * 60 * 60 * 1000));
    } else if (filter === 'week') {
      filtered = filtered.filter((d) => new Date(d.latest_detected) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else if (filter === 'month') {
      filtered = filtered.filter((d) => new Date(d.latest_detected) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    } else if (filter === 'new') {
      filtered = filtered.filter((d) => (d.total_sightings || 0) <= 1);
    } else if (filter === 'repeat') {
      filtered = filtered.filter((d) => (d.total_sightings || 0) > 1);
    }

    return filtered;
  }

  let { data: dogs = [], error } = await supabase.from(DOGS_TABLE).select('*');
  if (error) throw new ApiError(500, error.message);

  // load sightings for location/date filtering
  const { data: sightings = [] } = await supabase.from(SIGHTINGS_TABLE).select('*');

  if (dogId) {
    const needle = dogId.trim().toUpperCase();
    dogs = dogs.filter((d) => d.dog_id?.toUpperCase().includes(needle));
  }

  if (location) {
    const needle = location.trim().toLowerCase();
    const matchingIds = new Set(sightings.filter((s) => (s.address || '').toLowerCase().includes(needle)).map((s) => s.dog_id));
    dogs = dogs.filter((d) => matchingIds.has(d.dog_id) || (d.latest_address || '').toLowerCase().includes(needle));
  }

  if (date) {
    const matchingIds = new Set(sightings.filter((s) => s.date === date).map((s) => s.dog_id));
    dogs = dogs.filter((d) => matchingIds.has(d.dog_id));
  }

  const now = new Date();
  if (filter === 'today') {
    dogs = dogs.filter((d) => new Date(d.latest_detected) >= new Date(now.getTime() - 24 * 60 * 60 * 1000));
  } else if (filter === 'week') {
    dogs = dogs.filter((d) => new Date(d.latest_detected) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  } else if (filter === 'month') {
    dogs = dogs.filter((d) => new Date(d.latest_detected) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
  } else if (filter === 'new') {
    dogs = dogs.filter((d) => (d.total_sightings || 0) <= 1);
  } else if (filter === 'repeat') {
    dogs = dogs.filter((d) => (d.total_sightings || 0) > 1);
  }

  return dogs;
}

/**
 * Logs a fresh GPS location for a dog that's already known - used by the
 * "Relocate" button so a user can update where a dog currently is without
 * re-uploading a photo through the full AI detection flow. Appends a new
 * sighting row (so it shows up in the movement timeline / trace route) and
 * moves the dog's "latest location" forward, while keeping every earlier
 * point in sighting_history intact for the travel history.
 */
export async function recordRelocation({ dogId, latitude, longitude, address, capturedAt, uploadedBy }) {
  const capturedDate = capturedAt ? new Date(capturedAt) : new Date();
  const isoDate = capturedDate.toISOString().slice(0, 10);
  const isoTime = capturedDate.toTimeString().slice(0, 8);
  const sightingId = uuidv4();

  if (!isSupabaseConfigured || !supabase) {
    const { dogs, sightings } = getDemoStore();
    const dogIndex = dogs.findIndex((entry) => entry.dog_id === dogId);
    if (dogIndex === -1) throw new ApiError(404, `Dog ${dogId} not found.`);
    const existingDog = dogs[dogIndex];

    const nextDog = {
      ...existingDog,
      latest_detected: capturedDate.toISOString(),
      latest_latitude: latitude,
      latest_longitude: longitude,
      latest_address: address || existingDog.latest_address || null,
      total_sightings: (existingDog.total_sightings || 0) + 1
    };
    dogs[dogIndex] = nextDog;

    sightings.push({
      sighting_id: sightingId,
      dog_id: dogId,
      latitude,
      longitude,
      address: address || null,
      date: isoDate,
      time: isoTime,
      captured_at: capturedDate.toISOString(),
      image_url: existingDog.image_url,
      confidence: null,
      is_new_dog: false,
      uploaded_by: uploadedBy || null
    });

    await saveDemoStore();
    return { dog: nextDog, sightingId };
  }

  const { data: existingDog, error: fetchErr } = await supabase.from(DOGS_TABLE).select('*').eq('dog_id', dogId).single();
  if (fetchErr || !existingDog) throw new ApiError(404, `Dog ${dogId} not found.`);

  const dogPayload = {
    latest_detected: capturedDate.toISOString(),
    latest_latitude: latitude,
    latest_longitude: longitude,
    latest_address: address || existingDog.latest_address || null,
    total_sightings: (existingDog.total_sightings || 0) + 1
  };

  const { error: updateErr } = await supabase.from(DOGS_TABLE).update(dogPayload).eq('dog_id', dogId);
  if (updateErr) throw new ApiError(500, updateErr.message);

  const sightingPayload = {
    sighting_id: sightingId,
    dog_id: dogId,
    latitude,
    longitude,
    address: address || null,
    date: isoDate,
    time: isoTime,
    captured_at: capturedDate.toISOString(),
    image_url: existingDog.image_url,
    confidence: null,
    is_new_dog: false,
    uploaded_by: uploadedBy || null
  };

  const { error: insertErr } = await supabase.from(SIGHTINGS_TABLE).insert(sightingPayload);
  if (insertErr) throw new ApiError(500, insertErr.message);

  const { data: dogData, error: dogErr } = await supabase.from(DOGS_TABLE).select('*').eq('dog_id', dogId).single();
  if (dogErr) throw new ApiError(500, dogErr.message);

  return { dog: dogData, sightingId };
}

export async function deleteDog(dogId, uid) {
  if (!isSupabaseConfigured || !supabase) {
    const { dogs, sightings } = getDemoStore();
    const dog = dogs.find((entry) => entry.dog_id === dogId);
    if (!dog) throw new ApiError(404, `Dog ${dogId} not found.`);
    if (dog.uploaded_by !== uid) {
      throw new ApiError(403, 'You can only delete dogs that you uploaded.');
    }

    const dogIndex = dogs.findIndex((entry) => entry.dog_id === dogId);
    if (dogIndex !== -1) dogs.splice(dogIndex, 1);
    for (let i = sightings.length - 1; i >= 0; i -= 1) {
      if (sightings[i].dog_id === dogId) sightings.splice(i, 1);
    }

    await saveDemoStore();
    return { dogId };
  }

  const { data: dog, error: fetchErr } = await supabase.from(DOGS_TABLE).select('*').eq('dog_id', dogId).single();
  if (fetchErr || !dog) throw new ApiError(404, `Dog ${dogId} not found.`);
  if (dog.uploaded_by !== uid) {
    throw new ApiError(403, 'You can only delete dogs that you uploaded.');
  }

  const { error: sightingsErr } = await supabase.from(SIGHTINGS_TABLE).delete().eq('dog_id', dogId);
  if (sightingsErr) throw new ApiError(500, sightingsErr.message);

  const { error: dogErr } = await supabase.from(DOGS_TABLE).delete().eq('dog_id', dogId);
  if (dogErr) throw new ApiError(500, dogErr.message);

  return { dogId };
}

export async function getDashboardStats() {
  if (!isSupabaseConfigured || !supabase) {
    const { dogs, sightings } = getDemoStore();
    return {
      totalDogs: dogs.length,
      totalSightings: sightings.length,
      repeatSightings: sightings.filter((s) => !s.is_new_dog).length,
      newDogsToday: sightings.filter((s) => s.is_new_dog && s.date === new Date().toISOString().slice(0, 10)).length
    };
  }

  const [dogsRes, sightingsRes] = await Promise.all([
    supabase.from(DOGS_TABLE).select('*'),
    supabase.from(SIGHTINGS_TABLE).select('*')
  ]);

  if (dogsRes.error) throw new ApiError(500, dogsRes.error.message);
  if (sightingsRes.error) throw new ApiError(500, sightingsRes.error.message);

  const dogs = dogsRes.data || [];
  const sightings = sightingsRes.data || [];

  const totalDogs = dogs.length;
  const totalSightings = sightings.length;
  const repeatSightings = sightings.filter((s) => !s.is_new_dog).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const newDogsToday = sightings.filter((s) => s.is_new_dog && s.date === todayStr).length;

  return { totalDogs, totalSightings, repeatSightings, newDogsToday };
}

export async function getFullStats(range = 'month') {
  if (!isSupabaseConfigured || !supabase) {
    const { sightings } = getDemoStore();
    const now = new Date();
    const days = range === 'today' ? 1 : range === 'week' ? 7 : range === 'year' ? 365 : 30;
    const scoped = sightings.filter((s) => {
      const date = s.captured_at ? new Date(s.captured_at) : null;
      if (!date) return false;
      const diffMs = now.getTime() - date.getTime();
      return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
    });

    const newDogs = scoped.filter((s) => s.is_new_dog).length;
    const repeatDogs = scoped.filter((s) => !s.is_new_dog).length;
    const totalSightings = scoped.length;
    const uniqueDogIds = new Set(scoped.map((s) => s.dog_id));

    const byDayMap = {};
    scoped.forEach((s) => {
      byDayMap[s.date] = (byDayMap[s.date] || 0) + 1;
    });
    const byDay = Object.entries(byDayMap)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, count]) => ({ date, count }));

    return {
      totalDogs: uniqueDogIds.size,
      newDogs,
      repeatDogs,
      totalSightings,
      byDay,
      newVsRepeat: [
        { label: 'New', value: newDogs },
        { label: 'Repeat', value: repeatDogs }
      ]
    };
  }

  const { data: sightings = [], error } = await supabase.from(SIGHTINGS_TABLE).select('*');
  if (error) throw new ApiError(500, error.message);

  const now = new Date();
  const days = range === 'today' ? 1 : range === 'week' ? 7 : range === 'year' ? 365 : 30;
  const scoped = sightings.filter((s) => {
    const date = s.captured_at ? new Date(s.captured_at) : null;
    if (!date) return false;
    const diffMs = now.getTime() - date.getTime();
    return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
  });

  const newDogs = scoped.filter((s) => s.is_new_dog).length;
  const repeatDogs = scoped.filter((s) => !s.is_new_dog).length;
  const totalSightings = scoped.length;
  const uniqueDogIds = new Set(scoped.map((s) => s.dog_id));

  const byDayMap = {};
  scoped.forEach((s) => {
    byDayMap[s.date] = (byDayMap[s.date] || 0) + 1;
  });
  const byDay = Object.entries(byDayMap)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, count]) => ({ date, count }));

  return {
    totalDogs: uniqueDogIds.size,
    newDogs,
    repeatDogs,
    totalSightings,
    byDay,
    newVsRepeat: [
      { label: 'New', value: newDogs },
      { label: 'Repeat', value: repeatDogs }
    ]
  };
}

function toJsDate(val) {
  if (!val) return null;
  if (typeof val === 'string') return new Date(val);
  if (val instanceof Date) return val;
  return new Date(val);
}

export async function recordSighting({ aiResult, latitude, longitude, address, capturedAt }) {
  const capturedDate = capturedAt ? new Date(capturedAt) : new Date();
  const isoDate = capturedDate.toISOString().slice(0, 10);
  const isoTime = capturedDate.toTimeString().slice(0, 8);

  const sightingId = uuidv4();
  const isNewDog = !aiResult.isDuplicate || !aiResult.dogId;
  // generate dogId via counters table (atomic update)
  let dogId = aiResult.dogId;

  if (!isSupabaseConfigured || !supabase) {
    dogId = dogId || `DOG${String(getDemoStore().dogs.length + 1).padStart(3, '0')}`;
    return { sightingId, dogId, isNewDog, isoDate, isoTime, capturedDate };
  }

  if (isNewDog) {
    const { data, error } = await supabase
      .from(COUNTERS_TABLE)
      .select('last_number')
      .eq('name', 'dogCounter')
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      // table or row missing fallback to UUID-based dog id
      dogId = `DOG${Math.floor(Math.random() * 100000)}`;
    } else if (error) {
      dogId = `DOG${Math.floor(Math.random() * 100000)}`;
    } else {
      const next = (data?.last_number || 0) + 1;
      const { error: updErr } = await supabase
        .from(COUNTERS_TABLE)
        .update({ last_number: next })
        .eq('name', 'dogCounter');
      if (updErr) {
        dogId = `DOG${Math.floor(Math.random() * 100000)}`;
      } else {
        dogId = `DOG${String(next).padStart(3, '0')}`;
      }
    }
  }

  return { sightingId, dogId, isNewDog, isoDate, isoTime, capturedDate };
}

export async function persistSightingRecords({
  dogId,
  sightingId,
  isNewDog,
  imageUrl,
  latitude,
  longitude,
  address,
  isoDate,
  isoTime,
  capturedDate,
  confidence,
  uploadedBy
}) {
  if (!isSupabaseConfigured || !supabase) {
    const { dogs, sightings } = getDemoStore();
    const existingDog = dogs.find((entry) => entry.dog_id === dogId);
    const nextDog = {
      dog_id: dogId,
      image_url: imageUrl,
      first_detected: isNewDog ? capturedDate.toISOString() : existingDog?.first_detected || capturedDate.toISOString(),
      latest_detected: capturedDate.toISOString(),
      latest_latitude: latitude,
      latest_longitude: longitude,
      latest_address: address || null,
      total_sightings: (existingDog?.total_sightings || 0) + 1,
      // Only the very first uploader of a dog "owns" it - later sightings of
      // the same dog (by anyone) must never overwrite the original owner,
      // otherwise delete permissions would silently transfer between users.
      uploaded_by: existingDog?.uploaded_by || uploadedBy || null
    };

    if (existingDog) {
      const index = dogs.findIndex((entry) => entry.dog_id === dogId);
      dogs[index] = nextDog;
    } else {
      dogs.push(nextDog);
    }

    sightings.push({
      sighting_id: sightingId,
      dog_id: dogId,
      latitude,
      longitude,
      address: address || null,
      date: isoDate,
      time: isoTime,
      captured_at: capturedDate.toISOString(),
      image_url: imageUrl,
      confidence: confidence ?? null,
      is_new_dog: isNewDog,
      uploaded_by: uploadedBy || null
    });

    await saveDemoStore();
    return { dog: nextDog, sightingId };
  }

  // Preserve the original uploader on repeat sightings of the same dog -
  // ownership must never transfer to whoever uploads the next sighting.
  let ownerUid = uploadedBy || null;
  if (!isNewDog) {
    const { data: existingDog } = await supabase.from(DOGS_TABLE).select('uploaded_by').eq('dog_id', dogId).single();
    ownerUid = existingDog?.uploaded_by || ownerUid;
  }

  const dogPayload = {
    dog_id: dogId,
    image_url: imageUrl,
    first_detected: isNewDog ? capturedDate.toISOString() : null,
    latest_detected: capturedDate.toISOString(),
    latest_latitude: latitude,
    latest_longitude: longitude,
    latest_address: address || null,
    total_sightings: 1,
    uploaded_by: ownerUid
  };

  // Upsert dog row
  const { error: upsertErr } = await supabase.from(DOGS_TABLE).upsert(dogPayload, { onConflict: 'dog_id' });
  if (upsertErr) throw new ApiError(500, `DB error: ${upsertErr.message}`);

  const sightingPayload = {
    sighting_id: sightingId,
    dog_id: dogId,
    latitude,
    longitude,
    address: address || null,
    date: isoDate,
    time: isoTime,
    captured_at: capturedDate.toISOString(),
    image_url: imageUrl,
    confidence: confidence ?? null,
    is_new_dog: isNewDog,
    uploaded_by: uploadedBy || null
  };

  const { error: insertErr } = await supabase.from(SIGHTINGS_TABLE).insert(sightingPayload);
  if (insertErr) throw new ApiError(500, `DB error: ${insertErr.message}`);

  // increment total_sightings if not new
  if (!isNewDog) {
    // simple increment using SQL fragment
    await supabase.rpc('increment_counter', { table_name: DOGS_TABLE, key: 'dog_id', key_value: dogId }).catch(() => {});
  }

  // Return dog record (fetch)
  const { data: dogData, error: dogErr } = await supabase.from(DOGS_TABLE).select('*').eq('dog_id', dogId).single();
  if (dogErr) throw new ApiError(500, `DB error: ${dogErr.message}`);

  return { dog: dogData, sightingId };
}
