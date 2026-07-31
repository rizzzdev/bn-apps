import "express-async-errors";
import express from "express";
import { corsConfig } from "@/configs/cors";
import { appRoutes } from "@/app/routes";
import { sentriAuth } from "@/database";
import { cacheRouteMiddleware, clearCachePattern } from "@/utils/cache";
import { attachmentController } from "@/modules/attachment/controller";

export const createServer = () => {
  const app = express();

  app.use(corsConfig);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const getToken = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return req.cookies?.['sentri-session'] || null;
  };

  // Intercept GET /auth/me for caching
  app.get('/api/v1/auth/me', cacheRouteMiddleware((req) => {
    const token = getToken(req);
    return token ? `auth:me:${token}` : null;
  }, 600));

  // Intercept POST /auth/logout for immediate invalidation
  app.use('/api/v1/auth/logout', async (req, res, next) => {
    const token = getToken(req);
    if (token) {
      await clearCachePattern(`auth:me:${token}`);
    }
    next();
  });
  app.use("/api/v1/auth", sentriAuth.router());

  // Public file serving (no auth required)
  app.get('/api/v1/attachments/file/:url', (req, res, next) => attachmentController.serveFile(req, res, next));

  app.use("/api/v1", appRoutes);
  app.use(
    sentriAuth.errorHandler(),
  );

  return app;
};
