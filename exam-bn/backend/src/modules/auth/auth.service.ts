import { type IUserRepository } from "../user/user.interface.js";
import { type IAuthService } from "./auth.interface.js";
import { type LoginDto, type AuthResponse, type TokenPayload } from "./auth.types.js";
import { UnauthorizedError } from "../../utils/errors.js";
import { verifyHash } from "../../utils/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/token.js";
import { redisClient } from "../../configs/redis.config.js";
import { getIO } from "../../socket/socket-manager.js";

const ACCESS_TOKEN_TTL = 900; // 15 minutes
const REFRESH_TOKEN_TTL = 86400; // 1 day

export class AuthService implements IAuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  login = async (dto: LoginDto): Promise<AuthResponse> => {
    const user = await this.userRepository.getByUsername(dto.username);
    if (!user) throw new UnauthorizedError("Invalid username or password");

    const valid = await verifyHash(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid username or password");

    const payload: TokenPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await Promise.all([
      redisClient.setEx(`user_session:${user.id}`, ACCESS_TOKEN_TTL, accessToken),
      redisClient.setEx(`user_refresh:${user.id}`, REFRESH_TOKEN_TTL, refreshToken),
    ]);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, fullname: user.fullname, username: user.username, role: user.role },
    };
  };

  logout = async (userId: string): Promise<void> => {
    await Promise.all([
      redisClient.del(`user_session:${userId}`),
      redisClient.del(`user_refresh:${userId}`),
      redisClient.del(`user_profile:${userId}`),
    ]);

    // Force-disconnect all active sockets for this user so the online counter
    // updates immediately instead of waiting for the ping/pong timeout.
    const io = getIO();
    if (io) {
      const sockets = await io.fetchSockets();
      for (const socket of sockets) {
        if (socket.data.userId === userId) {
          socket.disconnect(true);
        }
      }
    }
  };

  me = async (payload: TokenPayload): Promise<AuthResponse["user"]> => {
    const cacheKey = `user_profile:${payload.id}`;

    // Prioritize Redis cache to avoid hitting the DB on almost every API call
    // (auth/me is fetched constantly to validate sessions on the frontend).
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached) as AuthResponse["user"];

    const user = await this.userRepository.getById(payload.id, {});
    if (!user) throw new UnauthorizedError("User not found");

    const result = {
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      role: user.role,
    };
    await redisClient.setEx(cacheKey, ACCESS_TOKEN_TTL, JSON.stringify(result));
    return result;
  };

  refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken) as TokenPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const stored = await redisClient.get(`user_refresh:${payload.id}`);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedError("Refresh token revoked or expired");
    }

    const newPayload: TokenPayload = {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };
    const accessToken = signAccessToken(newPayload);
    await redisClient.setEx(`user_session:${payload.id}`, ACCESS_TOKEN_TTL, accessToken);

    return { accessToken };
  };
}
