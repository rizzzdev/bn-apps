import { z } from 'zod';
export const assignmentAttachmentSchema = z.object({
    fileUrl: z.string().min(1),
    fileName: z.string().min(1),
});
export const createAssignmentSchema = z.object({
    title: z.string().min(3, 'Judul minimal 3 karakter'),
    description: z.string().min(1, 'Deskripsi wajib diisi'),
    deadline: z.string().min(1, 'Deadline wajib diisi'),
    status: z.enum(['Draft', 'Published']).optional().default('Draft'),
    classIds: z.array(z.string().min(1)).min(1, 'Pilih minimal satu kelas'),
    attachments: z.array(assignmentAttachmentSchema).optional(),
});
export const updateAssignmentSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(1).optional(),
    deadline: z.string().min(1).optional(),
    status: z.enum(['Draft', 'Published']).optional(),
    classIds: z.array(z.string().min(1)).optional(),
    attachments: z.array(assignmentAttachmentSchema).optional(),
});
