import { Router } from 'express';
import { prisma } from '#exam/database/index.js';
import { asyncHandler } from '#exam/utils/asyncHandler.js';
import { sendResponse } from '#app';
import { ExamLogRepository } from './exam-log.repository.js';

const repository = new ExamLogRepository(prisma);
const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const examRoomId = req.query.examRoomId as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    if (!examRoomId) {
      sendResponse(res, 200, 'No examRoomId provided.', []);
      return;
    }
    const data = await repository.getAll(examRoomId, limit);
    sendResponse(res, 200, 'Get exam logs successfully.', data);
  }),
);

export default router;
