import { z } from "zod";

export const createUserSchema = z.strictObject({
  fullname: z.string().min(1, "Fullname is required").max(255),
  username: z.string().min(1, "Username is required").max(100),
  passwordHash: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "SUPERVISOR", "PARTICIPANT"]),
});

export const updateUserSchema = createUserSchema.partial();
