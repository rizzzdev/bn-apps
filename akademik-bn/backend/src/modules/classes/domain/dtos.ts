import type { z } from 'zod';
import type { webhookClassSchema } from '@/modules/classes/domain/schemas';

export type WebhookClassDto = z.infer<typeof webhookClassSchema>;
