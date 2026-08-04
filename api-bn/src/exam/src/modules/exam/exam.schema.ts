import { z } from 'zod';

export const createExamSchema = z
  .strictObject({
    name: z.string().min(1, 'Nama ujian wajib diisi').max(255),
    description: z.string().nullish(),
    questionCreatorId: z.string().nullish(),
    startTime: z.coerce.date({ error: 'Waktu mulai wajib diisi' }),
    endTime: z.coerce.date({ error: 'Waktu selesai wajib diisi' }),
    passingGrade: z.number().min(0).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    if (data.startTime <= now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startTime'],
        message: 'Waktu mulai harus lebih dari waktu sekarang.',
      });
    }
    if (data.endTime <= now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Waktu selesai harus lebih dari waktu sekarang.',
      });
    }
    if (data.endTime <= data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Waktu selesai harus lebih dari waktu mulai.',
      });
    }
  });

export const updateExamSchema = z
  .strictObject({
    name: z.string().min(1, 'Nama ujian wajib diisi').max(255).optional(),
    description: z.string().nullish(),
    questionCreatorId: z.string().nullish(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    mcWeight: z.number().min(0).max(1).nullish(),
    essayWeight: z.number().min(0).max(1).nullish(),
    passingGrade: z.number().min(0).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Waktu selesai harus lebih dari waktu mulai.',
      });
    }
  });
