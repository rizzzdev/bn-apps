import { z } from 'zod';
const webhookPictureSchema = z.object({
    url: z.string().nullable(),
}).passthrough();
export const webhookTeacherSchema = z.object({
    id: z.string(),
    fullname: z.string(),
    prefixTitle: z.string().nullable().optional(),
    suffixTitle: z.string().nullable().optional(),
    prefix_title: z.string().nullable().optional(),
    suffix_title: z.string().nullable().optional(),
    gelarDepan: z.string().nullable().optional(),
    gelarBelakang: z.string().nullable().optional(),
    titlePrefix: z.string().nullable().optional(),
    titleSuffix: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    nip: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    userId: z.string(),
    pictureUrl: z.string().nullable().optional(),
    picture: webhookPictureSchema.optional(),
    status: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
}).passthrough();
