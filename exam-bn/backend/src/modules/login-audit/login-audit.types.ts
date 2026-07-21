import { type LoginAudit as LoginAuditBase } from "../../app/database/generated/client.js";
import { type User } from "../user/user.types.js";
import { type z } from "zod";
import { type createLoginAuditSchema, type updateLoginAuditSchema } from "./login-audit.schema.js";

export type LoginAudit = LoginAuditBase & {
  user?: User;
};

export type CreateLoginAuditDto = z.infer<typeof createLoginAuditSchema>;
export type UpdateLoginAuditDto = z.infer<typeof updateLoginAuditSchema>;
