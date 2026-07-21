import { z } from "zod";

export const createRoomSchema = z.strictObject({
  name: z.string().min(1, "Room name is required").max(255),
  capacity: z.number().int().positive("Capacity must be a positive integer").optional(),
});

export const updateRoomSchema = createRoomSchema.partial();
