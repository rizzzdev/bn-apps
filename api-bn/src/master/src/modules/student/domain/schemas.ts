import { z } from "zod";
import { StudentStatus, Gender, Religion } from '@master/database/index.js';

export const createStudentSchema = z.object({
  fullname: z.string().trim().min(1),
  nik: z.string().trim().optional(),
  birthplace: z.string().optional(),
  birthdate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  gender: z.nativeEnum(Gender).optional(),
  religion: z.nativeEnum(Religion).optional(),
  ethnicGroup: z.string().optional(),
  status: z.nativeEnum(StudentStatus).optional(),
  nis: z.string().trim().optional(),
  nisn: z.string().trim().optional(),
  height: z.number().int().optional(),
  weight: z.number().int().optional(),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/\D/g, "") : undefined)),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  userId: z.string().uuid().or(z.string().cuid()).optional(),
  currentClassId: z.string().uuid().optional(),
  currentMajorId: z.string().uuid().optional(),
  pictureId: z.string().uuid().optional().nullable(),
});

export const updateStudentSchema = createStudentSchema
  .omit({ userId: true })
  .partial();

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string().min(8, 'Password minimal 8 karakter'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Password dan konfirmasi password tidak sama',
  path: ['confirmPassword'],
});

export const batchGetStudentSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const bulkUpdateStudentStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.nativeEnum(StudentStatus),
});
