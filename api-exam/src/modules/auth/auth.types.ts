import { type z } from "zod";
import { type loginSchema } from "./auth.schema.js";
import { type UserRole } from "../user/user.types.js";

export type LoginDto = z.infer<typeof loginSchema>;

export type TokenPayload = {
  id: string;
  username: string;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    fullname: string;
    username: string;
    role: UserRole;
  };
};
