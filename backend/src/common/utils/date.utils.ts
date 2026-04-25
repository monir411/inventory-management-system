/**
 * Timezone-aware date utilities for Bangladesh Standard Time (UTC+6)
 */

/**
 * Returns the start and end of the day in UTC for a given date in Asia/Dhaka timezone.
 * @param date Optional date object, defaults to now.
 */
export function getBDDayRange(date: Date = new Date()) {
  // Asia/Dhaka is UTC+6
  const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
  
  // 1. Get the current time in BD by adding 6 hours to the UTC timestamp
  const nowBD = new Date(date.getTime() + BD_OFFSET_MS);
  
  // 2. Find the start of the day in BD (00:00:00)
  // We use UTC methods on the offset date to get the BD day parts
  const startOfTodayBD = new Date(Date.UTC(
    nowBD.getUTCFullYear(),
    nowBD.getUTCMonth(),
    nowBD.getUTCDate(),
    0, 0, 0, 0
  ));
  
  // 3. Convert back to UTC to get the actual range for database queries
  const startUtc = new Date(startOfTodayBD.getTime() - BD_OFFSET_MS);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  
  return { startUtc, endUtc };
}

/**
 * Helper to check if a date falls within the Bangladesh "Today" range.
 */
export function isTodayBD(date: Date | string | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  const { startUtc, endUtc } = getBDDayRange();
  return d >= startUtc && d < endUtc;
}

/**
 * Returns the current date in YYYY-MM-DD format for Asia/Dhaka.
 */
export function getBDTodayString(): string {
  const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
  const nowBD = new Date(new Date().getTime() + BD_OFFSET_MS);
  return nowBD.toISOString().split('T')[0];
}

/**
 * Checks if a date (or date string) matches the current Bangladesh date (YYYY-MM-DD).
 */
export function isTodayBDDate(date: Date | string | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Extract YYYY-MM-DD from the local parts of the Date object 
  // (TypeORM date columns are loaded as local midnight by default)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${day}`;
  
  return dateStr === getBDTodayString();
}
