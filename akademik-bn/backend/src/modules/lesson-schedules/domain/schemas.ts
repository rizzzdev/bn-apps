import { z } from 'zod';

export const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

export const createLessonScheduleSchema = z.object({
  subjectId: z.string().uuid(),
  lessonHourId: z.string().uuid(),
  day: z.enum(days),
  notes: z.string().optional(),
  teacherIds: z.array(z.string().uuid()).min(1, 'Minimal 1 guru'),
  classIds: z.array(z.string().uuid()).min(1, 'Minimal 1 kelas'),
});

export const updateLessonScheduleSchema = z.object({
  subjectId: z.string().uuid().optional(),
  lessonHourId: z.string().uuid().optional(),
  day: z.enum(days).optional(),
  notes: z.string().optional(),
  teacherIds: z.array(z.string().uuid()).min(1, 'Minimal 1 guru').optional(),
  classIds: z.array(z.string().uuid()).min(1, 'Minimal 1 kelas').optional(),
});
