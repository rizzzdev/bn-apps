import { z } from 'zod';

export const createInternshipPlacementSchema = z.object({
  studentId: z.string().trim().min(1, 'Student ID wajib diisi'),
  companyId: z.string().trim().min(1, 'Company ID wajib diisi'),
  teacherId: z.string().trim().min(1, 'Teacher ID wajib diisi'),
  industryMentorId: z.string().trim().min(1, 'Mentor ID wajib diisi'),
  startDate: z.coerce.date(),
  durationDays: z.number().int().positive('Durasi harus lebih dari 0'),
  status: z.enum(['active', 'completed', 'cancelled', 'discontinued']).optional(),
  isAssessable: z.boolean().optional(),
});

export const updateInternshipPlacementSchema = createInternshipPlacementSchema.partial();

export const bulkCreateInternshipPlacementSchema = z.object({
  studentIds: z.array(z.string().trim().min(1)).min(1, 'Minimal satu siswa harus dipilih'),
  companyId: z.string().trim().min(1, 'Company ID wajib diisi'),
  teacherId: z.string().trim().min(1, 'Teacher ID wajib diisi'),
  industryMentorId: z.string().trim().min(1, 'Mentor ID wajib diisi'),
  startDate: z.coerce.date(),
  durationDays: z.number().int().positive('Durasi harus lebih dari 0'),
  status: z.enum(['active', 'completed', 'cancelled', 'discontinued']).optional(),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu ID harus dipilih')
});

export const bulkUpdateStatusSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu ID harus dipilih'),
  status: z.enum(['active', 'completed', 'cancelled', 'discontinued'])
});

export const bulkUpdateAssessableSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu ID harus dipilih'),
  isAssessable: z.boolean()
});
