import { redisClient } from '#exam/configs/redis.config.js';
import { prisma } from '#exam/database/index.js';
import { type ExamSession } from '#exam/socket/socket.types.js';
import { type UpdateProgressDto } from './exam-session.types.js';
import { NotFoundError, ForbiddenError } from '#app/errors/index.js';

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
   * Resolve a user's display name from the shadow database
   * (the exam DB has no User table). Falls back to the userId.
   */
  private resolveDisplayName = async (userId: string): Promise<string> => {
    const teacher = await prisma.shadowTeacher.findFirst({
      where: { userId, deletedAt: null },
    });
    if (teacher) return teacher.fullname;

    const student = await prisma.shadowStudent.findFirst({
      where: { userId, deletedAt: null },
    });
    return student?.fullname ?? userId;
  };

  /**
   * Get or create an exam session for a participant.
   * Throws ForbiddenError if user is not a registered participant.
   */
  getOrCreate = async (examRoomId: string, userId: string): Promise<ExamSession> => {
    const participant = await prisma.examParticipant.findFirst({
      where: { examRoomId, userId },
    });

    if (!participant) {
      throw new ForbiddenError('You are not a participant in this exam room.');
    }

    const key = redisSessionKey(examRoomId, userId);
    const existing = await redisClient.get(key);

    if (existing) {
      return JSON.parse(existing) as ExamSession;
    }

    const username = await this.resolveDisplayName(userId);
    const session = defaultSession(userId, username, examRoomId);
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
      throw new ForbiddenError('You are not a participant in this exam room.');
    }

    const key = redisSessionKey(examRoomId, userId);
    const existing = await redisClient.get(key);

    if (!existing) {
      throw new NotFoundError('Exam session not found. Please join the exam first.');
    }

    const session = JSON.parse(existing) as ExamSession;

    if (session.isLocked) {
      throw new ForbiddenError('Your exam session is locked. Contact your supervisor.');
    }

    const updated: ExamSession = { ...session, currentQuestionIndex: dto.currentQuestionIndex };
    await redisClient.set(key, JSON.stringify(updated));
    return updated;
  };
}
