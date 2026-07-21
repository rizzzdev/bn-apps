import { z } from 'zod';
import { Gender } from '@/database/generated/client';

const genderSchema = z.nativeEnum(Gender);

export const webhookStudentSchema = z.object({
  id: z.string().uuid(),
  fullname: z.string(),
  gender: genderSchema.nullable().optional(),
  nis: z.string().nullable().optional(),
  nisn: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  userId: z.string(),
  pictureUrl: z.string().nullable().optional(),
  picture: z.object({
    url: z.string().nullable().optional(),
  }).nullable().optional(),
  status: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});
