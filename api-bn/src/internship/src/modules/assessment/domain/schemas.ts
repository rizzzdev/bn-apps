import { z } from 'zod';

export const createAssessmentSchema = z.object({
  placementId: z.string().trim().min(1, 'Placement ID wajib diisi'),
  assessorType: z.enum(['teacher', 'industry_mentor']),
  teacherId: z.string().trim().optional(),
  industryMentorId: z.string().trim().optional(),
  technicalScore: z.number().min(0).max(100).optional(),
  nonTechnicalScore: z.number().min(0).max(100).optional(),
  finalScore: z.number().min(0).max(100).optional(),
  notes: z.string().trim().optional(),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu ID harus dipilih')
});
