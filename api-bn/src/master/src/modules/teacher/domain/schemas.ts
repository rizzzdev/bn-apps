import { z } from 'zod';
import { TeacherStatus, Gender, Religion } from '@master/database/index.js';

export const createTeacherSchema = z.object({
  fullname: z.string().trim().min(1),
  nik: z.string().trim().optional(),
  birthplace: z.string().optional(),
  birthdate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  gender: z.nativeEnum(Gender).optional(),
  religion: z.nativeEnum(Religion).optional(),
  ethnicGroup: z.string().optional(),
  status: z.nativeEnum(TeacherStatus).optional(),
  prefixTitle: z.string().trim().optional(),
  suffixTitle: z.string().trim().optional(),
  nip: z.string().trim().optional(),
  height: z.number().int().optional(),
  weight: z.number().int().optional(),
  phoneNumber: z.string().trim().optional().transform(v => v ? v.replace(/\D/g, '') : undefined),
  email: z.string().trim().toLowerCase().email(),
  userId: z.string().optional(),
  password: z.string(),
  pictureId: z.string().uuid().optional().nullable(),
});

export const updateTeacherSchema = createTeacherSchema.omit({ nik: true, nip: true, userId: true }).partial();

export const batchGetTeacherSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const bulkUpdateTeacherStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.nativeEnum(TeacherStatus),
});
