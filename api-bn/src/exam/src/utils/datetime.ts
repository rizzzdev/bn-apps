/**
 * Returns the current date/time in UTC.
 * Use this for all database timestamps (createdAt, updatedAt, deletedAt).
 */
export const now = (): Date => {
  return new Date();
};

/**
 * Formats a Date object to an ISO 8601 string in WIB (Waktu Indonesia Barat, UTC+7).
 * Output includes the +07:00 offset so consumers can unambiguously parse the timezone.
 * Example: "2026-03-28T17:00:00.000+07:00"
 */
export const formatWIB = (date: Date): string => {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const wibDate = new Date(date.getTime() + WIB_OFFSET_MS);
  return wibDate.toISOString().replace("Z", "+07:00");
};
