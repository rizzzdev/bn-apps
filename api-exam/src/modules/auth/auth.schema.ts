import { z } from "zod";

export const loginSchema = z.strictObject({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
