import { z } from 'zod';

export const assignmentAttachmentSchema = z.object({
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
});

export const createAssignmentSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1),
  deadline: z.string().datetime(), // ISO 8601 string
  classId: z.string().uuid(),
  attachments: z.array(assignmentAttachmentSchema).optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export type AssignmentAttachmentDto = z.infer<typeof assignmentAttachmentSchema>;
export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentDto = z.infer<typeof updateAssignmentSchema>;
