import { z } from 'zod';

export const locationMetadataSchema = z.object({
  latitude: z.number(),
  longitude: z.number()
});

export const createAttendanceSchema = z.object({
  placementId: z.string().trim().min(1, 'Placement ID wajib diisi'),
  studentId: z.string().trim().min(1, 'Student ID wajib diisi'),
  type: z.enum(['check_in', 'check_out']),
  date: z.coerce.date(),
  time: z.coerce.date(),
  locationMetadata: locationMetadataSchema
});
