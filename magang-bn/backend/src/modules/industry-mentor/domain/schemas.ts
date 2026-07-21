import { z } from 'zod';

export const bulkCreateIndustryMentorSchema = z.array(z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().optional(),
  prefixTitle: z.string().trim().nullable().optional(),
  suffixTitle: z.string().trim().nullable().optional(),
  position: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
}));

export const createIndustryMentorSchema = z.object({
  companyId: z.string().trim().optional(),
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  prefixTitle: z.string().trim().optional(),
  suffixTitle: z.string().trim().optional(),
  position: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.email(),
  password: z.string().min(8, 'Password minimal 8 karakter!')
});

export const updateIndustryMentorSchema = createIndustryMentorSchema.partial();

export const bulkEditCompanySchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu ID harus dipilih'),
  companyId: z.string().trim().nullable().optional(),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu ID harus dipilih')
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password minimal 8 karakter!')
});
