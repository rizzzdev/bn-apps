import { z } from 'zod';

export const createClassSubjectRequirementSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().optional().nullable(),
  weeklyHours: z.number().int(),
  maxHoursPerDay: z.number().int().default(2),
});

export const updateClassSubjectRequirementSchema = createClassSubjectRequirementSchema.partial();

export const bulkUpsertClassSubjectRequirementSchema = z.object({
  requirements: z.array(createClassSubjectRequirementSchema),
});
