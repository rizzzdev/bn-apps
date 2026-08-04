import { z } from 'zod';

export const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

export const createScheduleEventSchema = z.object({
  name: z.string().min(1, 'Nama event wajib diisi'),
  day: z.enum(days),
  startHourId: z.string().uuid('startHourId harus berupa UUID'),
  durationHours: z
    .number()
    .int('Durasi harus bilangan bulat')
    .min(1, 'Durasi minimal 1 jam')
    .max(8, 'Durasi maksimal 8 jam')
    .default(1),
  notes: z.string().optional(),
});

export const updateScheduleEventSchema = createScheduleEventSchema.partial();

export const deleteScheduleEventsBatchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Minimal 1 id'),
});
