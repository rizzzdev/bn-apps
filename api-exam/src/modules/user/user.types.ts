import { type User as UserBase } from "../../app/database/generated/client.js";
import { type z } from "zod";
import { type createUserSchema, type updateUserSchema } from "./user.schema.js";

export type UserRole = "ADMIN" | "SUPERVISOR" | "PARTICIPANT";
export const UserRoleValues = ["ADMIN", "SUPERVISOR", "PARTICIPANT"] as const;

export type User = Omit<UserBase, "role"> & {
  role: UserRole;
};

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
