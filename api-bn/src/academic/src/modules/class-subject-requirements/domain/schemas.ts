import { z } from 'zod';

const baseClassSubjectRequirementSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().optional().nullable(),
  weeklyHours: z.number().int(),
  batchWeeklyHours: z.number().int().min(0).optional(),
  batchGroupId: z.string().uuid().optional().nullable(),
  maxHoursPerDay: z.number().int().default(2),
});

export const createClassSubjectRequirementSchema = baseClassSubjectRequirementSchema
  .refine((d) => (d.batchWeeklyHours ?? 0) <= d.weeklyHours, {
    message: 'JP batch tidak boleh melebihi total JP mingguan',
    path: ['batchWeeklyHours'],
  })
  .refine((d) => (d.batchWeeklyHours ?? 0) === 0 || d.batchGroupId != null, {
    message: 'JP batch harus disertai batchGroupId (grup batch eksplisit)',
    path: ['batchGroupId'],
  });

export const updateClassSubjectRequirementSchema = baseClassSubjectRequirementSchema.partial();

export const bulkUpsertClassSubjectRequirementSchema = z.object({
  requirements: z.array(createClassSubjectRequirementSchema),
});
