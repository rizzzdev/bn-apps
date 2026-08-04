/**
 * Sentinel value for active (non-deleted) records.
 * The schema uses nullable deletedAt (DateTime?) — null means alive.
 * Set to null on create; set to now() on soft-delete.
 */
export const ALIVE: null = null;
