import type { z } from 'zod';
import type { webhookMajorSchema } from '@/modules/majors/domain/schemas';

export type WebhookMajorDto = z.infer<typeof webhookMajorSchema>;
