import { type Request, type Response, type NextFunction } from "express";
import { verifyAccessToken } from "../../utils/token.js";
import { UnauthorizedError } from "../../utils/errors.js";
import { type TokenPayload } from "./auth.types.js";
import { redisClient } from "../../configs/redis.config.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token) as TokenPayload;

    // Check if token exists and matches in redis
    const sessionToken = await redisClient.get(`user_session:${payload.id}`);
    if (!sessionToken || sessionToken !== token) {
      throw new UnauthorizedError("Session expired or invalid");
    }

    request.user = payload;
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
};
