import { z } from 'zod';

export const updateRoleSchema = z.object({
  roles: z.array(z.string())
});

export const bulkUpdateRoleSchema = z.object({
  userIds: z.array(z.string()),
  roles: z.array(z.string())
});

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export type BulkUpdateRoleDto = z.infer<typeof bulkUpdateRoleSchema>;
