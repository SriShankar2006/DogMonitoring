import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const DOG_IMAGES_BUCKET = 'dog-images';

/**
 * Uploads a dog sighting image to Supabase Storage and returns its public URL.
 * @param {File} file
 * @param {string} fileName - unique file name (e.g. `${uuid}.jpg`)
 */
export async function uploadDogImage(file, fileName) {
  if (!isSupabaseConfigured || !supabase) {
    return URL.createObjectURL(file);
  }

  const { error } = await supabase.storage
    .from(DOG_IMAGES_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(DOG_IMAGES_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}
