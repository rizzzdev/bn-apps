import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { type Request } from "express";

export const sessionRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 200, // Limit each user/IP to 200 requests per windowMs
  keyGenerator: (req: Request, res) => {
    // If user is authenticated, limit by userId (avoids blocking whole school on shared NAT IP)
    const userReq = req as any;
    if (userReq.user?.id) {
      return userReq.user.id as string;
    }
    return req.ip || "unknown";
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
  },
});
