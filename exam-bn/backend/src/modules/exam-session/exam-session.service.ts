import { redisClient } from "../../configs/redis.config.js";
import { prisma } from "../../app/database/index.js";
import { type ExamSession } from "../../socket/socket.types.js";
import { type UpdateProgressDto } from "./exam-session.types.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors.js";

const redisSessionKey = (examRoomId: string, userId: string) =>
  `exam_session:${examRoomId}:${userId}`;

const defaultSession = (userId: string, username: string, examRoomId: string): ExamSession => ({
  userId,
  username,
  examRoomId,
  startedAt: new Date().toISOString(),
  currentQuestionIndex: 0,
  isLocked: false,
  violationCount: 0,
  lastViolationType: null,
});

export class ExamSessionService {
  /**
   * Get or create an exam session for a participant.
   * Throws ForbiddenError if user is not a registered participant.
   */
  getOrCreate = async (examRoomId: string, userId: string): Promise<ExamSession> => {
    const participant = await prisma.examParticipant.findFirst({
      where: { examRoomId, userId },
      include: { user: { select: { username: true } } },
    });

    if (!participant) {
      throw new ForbiddenError("You are not a participant in this exam room.");
    }

    const key = redisSessionKey(examRoomId, userId);
    const existing = await redisClient.get(key);

    if (existing) {
      return JSON.parse(existing) as ExamSession;
    }

    const session = defaultSession(userId, participant.user.username, examRoomId);
    await redisClient.set(key, JSON.stringify(session));
    return session;
  };

  /**
   * Update the currentQuestionIndex of a participant's session.
   * Only participant themselves can update progress.
   */
  updateProgress = async (
    examRoomId: string,
    userId: string,
    dto: UpdateProgressDto,
  ): Promise<ExamSession> => {
    const participant = await prisma.examParticipant.findFirst({
      where: { examRoomId, userId },
    });

    if (!participant) {
      throw new ForbiddenError("You are not a participant in this exam room.");
    }

    const key = redisSessionKey(examRoomId, userId);
    const existing = await redisClient.get(key);

    if (!existing) {
      throw new NotFoundError("Exam session not found. Please join the exam first.");
    }

    const session = JSON.parse(existing) as ExamSession;

    if (session.isLocked) {
      throw new ForbiddenError("Your exam session is locked. Contact your supervisor.");
    }

    const updated: ExamSession = { ...session, currentQuestionIndex: dto.currentQuestionIndex };
    await redisClient.set(key, JSON.stringify(updated));
    return updated;
  };
}
