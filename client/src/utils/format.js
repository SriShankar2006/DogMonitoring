import { format, formatDistanceToNow } from 'date-fns';

/**
 * Normalizes the various timestamp shapes we can receive into a JS Date:
 * - Firestore SDK Timestamp (has .toDate())
 * - Firestore REST/Admin JSON serialization ({ _seconds, _nanoseconds } or { seconds, nanoseconds })
 * - ISO strings / numbers
 */
export function toJsDate(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput?.toDate === 'function') return dateInput.toDate();
  if (typeof dateInput === 'object') {
    const seconds = dateInput._seconds ?? dateInput.seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000);
  }
  const date = new Date(dateInput);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(dateInput) {
  const date = toJsDate(dateInput);
  if (!date) return '—';
  return format(date, 'dd MMM yyyy');
}

export function formatDateTime(dateInput) {
  const date = toJsDate(dateInput);
  if (!date) return '—';
  return format(date, 'dd MMM yyyy, hh:mm a');
}

export function formatRelative(dateInput) {
  const date = toJsDate(dateInput);
  if (!date) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}
