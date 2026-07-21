import type { z } from 'zod';
import type { webhookStudentSchema } from '@/modules/students/domain/schemas';

export type WebhookStudentDto = z.infer<typeof webhookStudentSchema>;
