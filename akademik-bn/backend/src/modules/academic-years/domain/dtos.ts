import type { z } from 'zod';
import type { webhookAcademicYearSchema } from '@/modules/academic-years/domain/schemas';

export type WebhookAcademicYearDto = z.infer<typeof webhookAcademicYearSchema>;
