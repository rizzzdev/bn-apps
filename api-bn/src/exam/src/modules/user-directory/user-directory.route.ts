import { Router, type Request, type Response, type NextFunction } from 'express';
import { sendResponse } from '#app';
import { userDirectoryService } from './user-directory.service.js';

const router = Router();

const parseLimit = (raw: unknown): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1000;
};

router.get(
  '/',
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const role = (request.query.role as string | undefined)?.toLowerCase();
      const limit = parseLimit(request.query.limit);
      const examRoomId = request.query.examRoomId as string | undefined;
      const users = await userDirectoryService.getAll(role, limit, examRoomId);
      sendResponse(response, 200, 'Get users successfully.', users);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id',
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = String(request.params.id ?? '');
      const user = await userDirectoryService.getById(userId);
      sendResponse(response, 200, user ? 'Get user successfully.' : 'User not found.', user);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
