import { z } from 'zod';

export const createDailyLogbookSchema = z.object({
  placementId: z.string().trim().min(1, 'Placement ID wajib diisi'),
  date: z.coerce.date(),
  activityTitle: z.string().trim().min(1, 'Judul aktivitas wajib diisi'),
  description: z.string().trim().optional(),
});

export const updateDailyLogbookSchema = createDailyLogbookSchema.partial().extend({
  deletedAttachmentIds: z.union([
    z.string(),
    z.array(z.string())
  ]).optional().transform(val => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [val];
    } catch {
      return [val];
    }
  })
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu ID harus dipilih')
});

export const createLogbookReviewSchema = z.object({
  action: z.enum(['revision', 'approved']),
  content: z.string().optional()
});
