import { z } from 'zod';

export const createTeacherUnavailabilitySchema = z.object({
  teacherId: z.string().uuid(),
  day: z.string().min(1),
  lessonHourId: z.string().uuid(),
  reason: z.string().optional(),
});

export const bulkSetTeacherUnavailabilitySchema = z.object({
  teacherId: z.string().uuid(),
  unavailabilities: z.array(
    z.object({
      day: z.string().min(1),
      lessonHourId: z.string().uuid(),
      reason: z.string().optional(),
    }),
  ),
});
