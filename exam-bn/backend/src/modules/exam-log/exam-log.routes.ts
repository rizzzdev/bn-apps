import { Router } from "express";
import { prisma } from "../../app/database/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { ExamLogRepository } from "./exam-log.repository.js";

const repository = new ExamLogRepository(prisma);
const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const examRoomId = req.query.examRoomId as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    if (!examRoomId) {
      sendSuccess({ response: res, data: [], message: "No examRoomId provided." });
      return;
    }
    const data = await repository.getAll(examRoomId, limit);
    sendSuccess({ response: res, data, message: "Get exam logs successfully." });
  }),
);

export default router;
