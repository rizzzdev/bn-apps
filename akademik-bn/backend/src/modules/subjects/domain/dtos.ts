import type { z } from 'zod';
import type { webhookSubjectSchema } from '@/modules/subjects/domain/schemas';

export type WebhookSubjectDto = z.infer<typeof webhookSubjectSchema>;
