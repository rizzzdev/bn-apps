import { z } from 'zod';

export const webhookLessonHourSchema = z.object({
  id: z.string(),
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  order: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
}).passthrough();

export const webhookLessonScheduleTeacherSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  createdAt: z.string(),
  deletedAt: z.string().nullable(),
  teacher: z.any().optional(),
}).passthrough();

export const webhookLessonScheduleClassSchema = z.object({
  id: z.string(),
  classId: z.string(),
  createdAt: z.string(),
  deletedAt: z.string().nullable(),
  class: z.any().optional(),
}).passthrough();

export const webhookLessonScheduleSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  lessonHourId: z.string(),
  day: z.string(),
  notes: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  subject: z.any().optional(),
  lessonHour: webhookLessonHourSchema,
  teachers: z.array(webhookLessonScheduleTeacherSchema),
  classes: z.array(webhookLessonScheduleClassSchema),
}).passthrough();

export type WebhookLessonScheduleDto = z.infer<typeof webhookLessonScheduleSchema>;
export type WebhookLessonHourDto = z.infer<typeof webhookLessonHourSchema>;
