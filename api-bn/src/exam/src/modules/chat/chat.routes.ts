import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '#exam/database/index.js';
import { toExamRole } from '#exam/utils/roles.js';
import { ForbiddenError, BadRequestError } from '#app/errors/index.js';
import { ChatRepository } from './chat.repository.js';
import { sendResponse } from '#app';

const router = Router();
const repo = new ChatRepository(prisma);

const ensureChatRole = (roles?: string[]): 'super_admin' | 'teacher' => {
  const role = toExamRole(roles ?? []);
  if (role !== 'super_admin' && role !== 'teacher') {
    throw new ForbiddenError('Hanya admin dan pengawas yang dapat menggunakan chat ini.');
  }
  return role;
};

router.get(
  '/contacts',
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const role = ensureChatRole(request.user?.roles);
      const oppositeRole = role === 'super_admin' ? 'teacher' : 'super_admin';
      const contacts = await repo.getContacts(oppositeRole);
      sendResponse(response, 200, 'Success', contacts);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/conversations',
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      ensureChatRole(request.user?.roles);
      const conversations = await repo.getConversations(request.user!.id);
      sendResponse(response, 200, 'Success', conversations);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/conversations/:otherUserId',
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      ensureChatRole(request.user?.roles);
      const otherUserId = String(request.params.otherUserId ?? '');
      if (!otherUserId) throw new BadRequestError('ID lawan bicara wajib diisi.');

      const messages = await repo.getConversation(request.user!.id, otherUserId);
      await repo.markRead(request.user!.id, otherUserId);
      sendResponse(response, 200, 'Success', messages);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
