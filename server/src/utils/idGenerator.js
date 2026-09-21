// This module is unused dead code. Dog ID generation now lives inline in
// `recordSighting()` inside services/supabasePersistenceService.js (it needed
// access to demo-mode state that this standalone helper didn't have).
// Kept only as a stub so no import path breaks if something still references it.
export async function generateNextDogId() {
  throw new Error(
    'generateNextDogId() is deprecated. Use recordSighting() in supabasePersistenceService.js instead.'
  );
}
