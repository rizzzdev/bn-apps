import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '#exam/database/index.js';
import { sendResponse } from '#app';
import { NotificationRepository } from './notification.repository.js';

const router = Router();
const repo = new NotificationRepository(prisma);

// GET /api/v1/notifications — list for the current user
router.get(
  '/',
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = request.user!.id;
      const notifications = await repo.getByUser(userId);
      sendResponse(response, 200, 'Success', notifications);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/notifications/mark-all-read — mark all as read
router.patch(
  '/mark-all-read',
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      await repo.markAllRead(request.user!.id);
      sendResponse(response, 200, 'Semua notifikasi ditandai sudah dibaca.', null);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/notifications — bulk soft-delete all for current user
router.delete(
  '/',
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      await repo.bulkSoftDelete(request.user!.id);
      sendResponse(response, 200, 'Semua notifikasi dihapus.', null);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
