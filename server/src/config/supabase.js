import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  return value.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$|\/$/, '');
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const hasSupabaseCredentials = Boolean(supabaseUrl && serviceRoleKey);

export const isSupabaseConfigured = hasSupabaseCredentials;
export const supabase = hasSupabaseCredentials
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

export const DOG_IMAGES_BUCKET = process.env.SUPABASE_BUCKET || 'dog-images';
