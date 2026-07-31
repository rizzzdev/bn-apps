import { z } from 'zod';

export const createApplicationSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  materialIcon: z.string().trim().min(1),
  link: z.string().trim().min(1),
  /**
   * Optional display position. Smaller numbers appear first in list views.
   * If omitted, the service auto-fills with `(max order) + 1` from the DB.
   * Negative values are rejected at the API boundary.
   */
  order: z.number().int().min(0).optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial();

export const batchGetApplicationSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
