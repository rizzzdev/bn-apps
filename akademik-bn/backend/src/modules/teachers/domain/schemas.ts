import { z } from 'zod';
import { Gender } from '@/database/generated/client';

const genderSchema = z.nativeEnum(Gender);

export const webhookTeacherSchema = z.object({
  id: z.string().uuid(),
  fullname: z.string(),
  prefixTitle: z.string().nullable().optional(),
  suffixTitle: z.string().nullable().optional(),
  gender: genderSchema.nullable().optional(),
  nip: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  userId: z.string(),
   pictureUrl: z.string().nullable().optional(),
   picture: z.object({
    url: z.string().nullable().optional(),
  }).nullable().optional(),
  status: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});
