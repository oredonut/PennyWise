// ============================================================
// PennyWise — Date / time helpers (single source of truth)
//
// All user-facing dates and greetings are computed in Africa/Lagos
// (West Africa Time, UTC+1, no daylight saving). We shift the epoch
// by a fixed +1h and read UTC fields, which is engine-independent —
// Hermes does not reliably support named IANA time zones in Intl.
// ============================================================

export const APP_TIMEZONE = 'Africa/Lagos';

const LAGOS_OFFSET_MS = 60 * 60 * 1000; // UTC+1, fixed year-round

/** A Date whose UTC fields represent the current wall-clock time in Lagos. */
function toLagos(now: Date): Date {
  return new Date(now.getTime() + LAGOS_OFFSET_MS);
}

/** Time-of-day greeting based on Lagos local hour. */
export function greeting(now: Date = new Date()): string {
  const h = toLagos(now).getUTCHours();
  return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
}

/** Uppercase long date label, e.g. "SUNDAY, 12 JUNE" (Lagos calendar day). */
export function dateLabel(now: Date = new Date()): string {
  return toLagos(now)
    .toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC', // fields already shifted to Lagos above
    })
    .toUpperCase();
}
