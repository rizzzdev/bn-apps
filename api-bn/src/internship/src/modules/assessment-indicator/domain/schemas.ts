import { z } from 'zod';

export const createAssessmentIndicatorSchema = z.object({
  placementId: z.string().trim().min(1, 'Placement ID wajib diisi'),
  description: z.string().trim().min(1, 'Deskripsi indikator wajib diisi'),
  order: z.number().int().min(0).optional(),
});

export const updateAssessmentIndicatorSchema = createAssessmentIndicatorSchema.partial();

export const bulkCreateAssessmentIndicatorSchema = z.object({
  placementId: z.string().trim().min(1, 'Placement ID wajib diisi'),
  indicators: z.array(z.object({
    description: z.string().trim().min(1, 'Deskripsi indikator wajib diisi'),
    order: z.number().int().min(0).optional(),
  })).min(1, 'Minimal satu indikator harus ditambahkan'),
});

export const bulkDeleteIndicatorSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu ID harus dipilih'),
});
