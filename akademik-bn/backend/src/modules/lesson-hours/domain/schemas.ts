import { z } from 'zod';

export const createLessonHourSchema = z.object({
  name: z.string().min(1, 'Nama jam pelajaran wajib diisi'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:mm'),
  order: z.number().int().min(1),
});

export const updateLessonHourSchema = createLessonHourSchema.partial();
