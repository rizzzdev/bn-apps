import { z } from 'zod';

const AssessorTypeEnum = z.enum(['teacher', 'industry_mentor']);

export const createAssessmentScoreSchema = z.object({
  indicatorId: z.string().trim().min(1, 'Indicator ID wajib diisi'),
  assessorType: AssessorTypeEnum,
  assessorId: z.string().trim().min(1, 'Assessor ID wajib diisi'),
  score: z.number().min(0, 'Nilai minimal 0').max(100, 'Nilai maksimal 100'),
  notes: z.string().optional(),
});

export const updateAssessmentScoreSchema = createAssessmentScoreSchema.partial();

export const bulkSubmitScoreSchema = z.object({
  placementId: z.string().trim().min(1, 'Placement ID wajib diisi'),
  assessorType: AssessorTypeEnum,
  assessorId: z.string().trim().min(1, 'Assessor ID wajib diisi'),
  scores: z.array(z.object({
    indicatorId: z.string().trim().min(1, 'Indicator ID wajib diisi'),
    score: z.number().min(0, 'Nilai minimal 0').max(100, 'Nilai maksimal 100'),
    notes: z.string().optional(),
  })).min(1, 'Minimal satu skor harus dikirim'),
});
