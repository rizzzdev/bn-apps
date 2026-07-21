import { z } from 'zod';

const webhookPictureSchema = z.object({
  url: z.string().nullable(),
}).passthrough();

export const webhookStudentSchema = z.object({
  id: z.string(),
  fullname: z.string(),
  gender: z.string().nullable().optional(),
  nis: z.string().nullable().optional(),
  nisn: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  userId: z.string(),
  pictureUrl: z.string().nullable().optional(),
  picture: webhookPictureSchema.optional(),
  status: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
}).passthrough();

export type WebhookStudentDto = z.infer<typeof webhookStudentSchema>;
