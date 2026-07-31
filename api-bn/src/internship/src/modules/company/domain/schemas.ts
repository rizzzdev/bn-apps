import { z } from 'zod';

export const bulkCreateCompanySchema = z.array(z.object({
  name: z.string().trim().min(1, 'Nama perusahaan wajib diisi'),
  address: z.string().trim().nullable().optional(),
  contactPerson: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  quota: z.number().int().min(0).optional().default(0),
}));

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  address: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  quota: z.number().int().min(0).optional(),
  checkInTime: z.string().trim().optional().nullable(),
  checkOutTime: z.string().trim().optional().nullable(),
  locationMetadata: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu ID harus dipilih')
});
