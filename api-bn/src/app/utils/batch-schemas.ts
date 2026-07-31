import { z } from 'zod';

/**
 * Standardized Zod schemas for batch operations.
 *
 * Konvensi yang dipakai di seluruh project:
 *  - Batch get / batch delete: body berisi `{ ids: string[] }`
 *  - Batch create JSON: body berisi `{ data: T[] }`
 *  - Batch partial update: body berisi `{ ids: string[] }` + field tambahan
 */

/** Body untuk ambil banyak by ids dan untuk bulk delete. */
export const batchIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Minimal satu ID harus diisi'),
});

/**
 * Body untuk bulk create (JSON). Field "data" membungkus array item
 * agar FE konsisten dan mudah ditambah metadata lain di masa depan.
 */
export const batchCreateDataSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema).min(1, 'Minimal satu item harus diisi'),
  });
