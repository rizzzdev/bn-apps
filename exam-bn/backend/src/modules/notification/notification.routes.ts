import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../../app/database/index.js";
import { authenticate } from "../auth/auth.middleware.js";
import { sendSuccess } from "../../utils/response.js";
import { NotificationRepository } from "./notification.repository.js";

const router = Router();
const repo = new NotificationRepository(prisma);

// GET /api/v1/notifications — list for the current user
router.get(
  "/",
  authenticate,
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = request.user!.id;
      const notifications = await repo.getByUser(userId);
      sendSuccess({ response, data: notifications });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/notifications/mark-all-read — mark all as read
router.patch(
  "/mark-all-read",
  authenticate,
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      await repo.markAllRead(request.user!.id);
      sendSuccess({ response, data: null, message: "Semua notifikasi ditandai sudah dibaca." });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/notifications — bulk soft-delete all for current user
router.delete(
  "/",
  authenticate,
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      await repo.bulkSoftDelete(request.user!.id);
      sendSuccess({ response, data: null, message: "Semua notifikasi dihapus." });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
