import { type LoginDto, type AuthResponse, type TokenPayload } from "./auth.types.js";

export interface IAuthService {
  login(dto: LoginDto): Promise<AuthResponse>;
  logout(userId: string): Promise<void>;
  me(payload: TokenPayload): Promise<AuthResponse["user"]>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }>;
}

export interface IAuthController {
  login: (req: unknown, res: unknown) => Promise<void>;
  logout: (req: unknown, res: unknown) => Promise<void>;
  me: (req: unknown, res: unknown) => Promise<void>;
  refreshAccessToken: (req: unknown, res: unknown) => Promise<void>;
}
