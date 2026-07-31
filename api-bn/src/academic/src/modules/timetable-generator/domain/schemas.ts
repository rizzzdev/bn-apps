import { z } from 'zod';

export const generateScheduleOptionsSchema = z.object({
  workingDays: z.array(z.string()).min(1).default(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']),
  classIds: z.array(z.string().uuid()).optional(),
  timeoutMs: z.number().int().min(1000).max(60000).default(15000),
  maxAttempts: z.number().int().min(1000).max(2000000).default(500000),
  enableBatchTeaching: z.boolean().optional().default(true),
});

export const commitScheduleSchema = z.object({
  clearExisting: z.boolean().default(true),
  schedules: z.array(
    z.object({
      day: z.string(),
      lessonHourId: z.string().uuid(),
      subjectId: z.string().uuid(),
      classId: z.string().uuid(),
      teacherId: z.string().uuid(),
      classIds: z.array(z.string().uuid()).optional(),
      teacherIds: z.array(z.string().uuid()).optional(),
    }),
  ),
});
