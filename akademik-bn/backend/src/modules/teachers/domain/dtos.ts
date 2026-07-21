import type { z } from 'zod';
import type { webhookTeacherSchema } from '@/modules/teachers/domain/schemas';

export type WebhookTeacherDto = z.infer<typeof webhookTeacherSchema>;
