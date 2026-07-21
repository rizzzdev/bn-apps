import { z } from "zod";

export const createLoginAuditSchema = z.strictObject({
  userId: z.string().min(1, "User ID is required"),
  token: z.string().min(1, "Token is required"),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  loginAt: z.coerce.date().nullish(),
  logoutAt: z.coerce.date().nullish(),
});

export const updateLoginAuditSchema = createLoginAuditSchema.partial();
