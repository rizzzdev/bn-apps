import { z } from 'zod';
export const materialAttachmentSchema = z.object({
    fileUrl: z.string().min(1),
    fileName: z.string().min(1),
});
export const createMaterialSchema = z.object({
    title: z.string().min(3, 'Judul minimal 3 karakter'),
    content: z.string().min(1, 'Konten materi tidak boleh kosong'),
    status: z.enum(['Draft', 'Published']).optional().default('Draft'),
    classIds: z.array(z.string().min(1)).optional(),
    classId: z.string().optional(),
    attachments: z.array(materialAttachmentSchema).optional(),
}).refine((data) => (data.classIds && data.classIds.length > 0) || Boolean(data.classId), {
    message: 'Pilih minimal satu kelas',
    path: ['classIds'],
});
export const updateMaterialSchema = z.object({
    title: z.string().min(3).optional(),
    content: z.string().min(1).optional(),
    status: z.enum(['Draft', 'Published']).optional(),
    classIds: z.array(z.string().min(1)).optional(),
    classId: z.string().optional(),
    attachments: z.array(materialAttachmentSchema).optional(),
});
