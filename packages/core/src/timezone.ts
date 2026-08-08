/**
 * Timezone-aware date helpers.
 *
 * The database stores timestamps in UTC. When we need to determine "which calendar
 * day does this session belong to?" or "when does the week start?" for a specific
 * user, we must apply their local timezone offset.
 *
 * All offsetMinutes parameters are the negation of JavaScript's
 * `new Date().getTimezoneOffset()` — i.e., UTC+5:30 = 330, UTC-5 = -300.
 * This matches how real timezones work (positive = east of UTC).
 */

/**
 * Get the local calendar day key (YYYY-MM-DD) for a UTC ISO timestamp,
 * adjusted by the user's timezone offset.
 *
 * Example: A session ending at 2025-11-15T03:00:00Z for a user in EST (UTC-5, offset=-300)
 * is still on Nov 14 local time, so the key is "2025-11-14".
 */
export function toLocalDayKey(isoString: string, offsetMinutes: number): string {
  const utcMs = new Date(isoString).getTime();
  if (isNaN(utcMs)) return isoString.slice(0, 10); // fallback
  const localMs = utcMs + offsetMinutes * 60_000;
  const d = new Date(localMs);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get the local calendar "today" key for a given UTC timestamp and timezone offset.
 */
export function getLocalTodayKey(now: Date, offsetMinutes: number): string {
  const localMs = now.getTime() + offsetMinutes * 60_000;
  const d = new Date(localMs);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns a Date representing midnight (00:00:00.000) of the current local day,
 * expressed as a UTC Date object. Useful for DB queries (gte comparisons).
 *
 * Example: For a user in EST (UTC-5, offset=-300) at 2025-11-15T14:00:00Z:
 *   Local day start is 2025-11-15T05:00:00Z (midnight EST expressed in UTC).
 */
export function getLocalDayStart(now: Date, offsetMinutes: number): Date {
  // Compute UTC ms at local midnight
  const localMs = now.getTime() + offsetMinutes * 60_000;
  const localDate = new Date(localMs);
  const localMidnightMs =
    Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), 0, 0, 0, 0);
  // Convert back to UTC by subtracting offset
  return new Date(localMidnightMs - offsetMinutes * 60_000);
}

/**
 * Returns the UTC ISO string for midnight of the local Monday (start of week).
 * Weeks start on Monday per ISO 8601.
 *
 * Example: For a user in IST (UTC+5:30, offset=330) on Thursday 2025-11-13:
 *   Local Monday is 2025-11-10. Midnight IST = 2025-11-09T18:30:00Z.
 *   Returns "2025-11-09T18:30:00.000Z".
 */
export function getLocalWeekStart(now: Date, offsetMinutes: number): string {
  const localMs = now.getTime() + offsetMinutes * 60_000;
  const localDate = new Date(localMs);
  const dayOfWeek = localDate.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const mondayMidnightLocalMs =
    Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate() - daysSinceMonday, 0, 0, 0, 0);

  return new Date(mondayMidnightLocalMs - offsetMinutes * 60_000).toISOString();
}

/**
 * Converts a timezone offset (like +330 for IST) to a signed string like "+05:30"
 * or "-05:00" for display or passing to other systems.
 */
export function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

/**
 * Browser convenience: returns the user's timezone offset in minutes using the
 * same convention as this module (positive = east of UTC, e.g. IST = +330).
 *
 * JavaScript's getTimezoneOffset() returns MINUTES TO ADD to local time to get UTC,
 * which is the NEGATIVE of what we use. So we negate it.
 */
export function getBrowserTimezoneOffset(): number {
  return -new Date().getTimezoneOffset();
}
