import { prisma } from '#exam/database/index.js';
import { redisClient } from '#exam/configs/redis.config.js';
import { ExamLogRepository } from '#exam/modules/exam-log/exam-log.repository.js';
import { notifyUsers } from '#exam/modules/notification/index.js';

const examLogRepo = new ExamLogRepository(prisma);

export type SubmitResult =
  | { submitted: true; score: number; autoScored: true }
  | { submitted: true; score: null; autoScored: false }
  | { submitted: false; alreadySubmitted: true };

/**
 * Marks a participant's exam as submitted and scores it if possible. Shared by
 * the participant-facing POST /:id/submit route and the background lifecycle
 * ticker's force-submit sweep (participants who answered at least one question
 * but never explicitly submitted before the exam ended).
 */
export const submitParticipant = async (
  examRoomId: string,
  userId: string,
): Promise<SubmitResult> => {
  const alreadySubmittedInRedis = await redisClient.get(`exam_submitted:${examRoomId}:${userId}`);
  const participant = await prisma.examParticipant.findFirst({
    where: { examRoomId, userId },
    select: { status: true },
  });
  if (alreadySubmittedInRedis || participant?.status === 'SUBMITTED') {
    return { submitted: false, alreadySubmitted: true };
  }

  await redisClient.set(`exam_submitted:${examRoomId}:${userId}`, '1');
  await prisma.examParticipant.updateMany({
    where: { examRoomId, userId },
    data: { status: 'SUBMITTED' },
  });

  const examQuestions = await prisma.examQuestion.findMany({
    where: { examRoomId, deletedAt: null },
    include: { question: { include: { correctAnswer: true } } },
  });

  const allMC =
    examQuestions.length > 0 &&
    examQuestions.every((eq) => eq.question?.type === 'MULTIPLE_CHOICE');

  if (allMC) {
    const answers = await prisma.examAnswer.findMany({ where: { examRoomId, userId } });
    const answerMap = new Map(answers.map((a) => [a.questionId, a.optionId]));

    let correct = 0;
    for (const eq of examQuestions) {
      const correctOptionId = eq.question?.correctAnswer?.optionId;
      const participantOptionId = answerMap.get(eq.questionId);
      if (correctOptionId && participantOptionId === correctOptionId) correct++;
    }
    const score = examQuestions.length > 0 ? Math.round((correct / examQuestions.length) * 100) : 0;

    const examRoomInfo = await prisma.examRoom.findFirst({
      where: { id: examRoomId },
      select: { examId: true },
    });
    const examInfo = examRoomInfo
      ? await prisma.exam.findFirst({ where: { id: examRoomInfo.examId } })
      : null;
    const passingGrade = examInfo?.passingGrade ?? 75;
    const passed = score >= passingGrade;

    const existing = await prisma.examScore.findFirst({ where: { examRoomId, userId } });
    if (existing) {
      await prisma.examScore.update({ where: { id: existing.id }, data: { score, passed } });
    } else {
      await prisma.examScore.create({ data: { examRoomId, userId, score, passed } });
    }

    await examLogRepo.create({
      examRoomId,
      userId,
      type: 'submit',
      message: `Peserta mengumpulkan ujian. Skor: ${score}.`,
    });

    void notifyUsers(
      prisma,
      [userId],
      'score_ready',
      'Nilai Keluar',
      `Nilai ujian "${examInfo?.name ?? ''}" Anda: ${score} (${passed ? 'Lulus' : 'Tidak Lulus'}).`,
      examInfo?.name ?? undefined,
    );

    return { submitted: true, score, autoScored: true };
  }

  const existing = await prisma.examScore.findFirst({ where: { examRoomId, userId } });
  if (!existing) {
    await prisma.examScore.create({ data: { examRoomId, userId, score: null } });
  }
  await examLogRepo.create({
    examRoomId,
    userId,
    type: 'submit',
    message: 'Peserta mengumpulkan ujian. Menunggu koreksi esai.',
  });

  return { submitted: true, score: null, autoScored: false };
};

/**
 * Force-submits every NOT_SUBMITTED participant in a room who has answered at
 * least one question — called once a room transitions to ENDED, so absent or
 * disconnected participants still get scored instead of being left dangling.
 * Participants with zero answers are left NOT_SUBMITTED (counted as "tidak
 * mengumpulkan" in statistics).
 */
export const forceSubmitAbsentParticipants = async (examRoomId: string): Promise<void> => {
  const notSubmitted = await prisma.examParticipant.findMany({
    where: { examRoomId, status: 'NOT_SUBMITTED' },
    select: { userId: true },
  });
  if (notSubmitted.length === 0) return;

  const answeredUserIds = Array.from(
    new Set(
      (
        await prisma.examAnswer.findMany({
          where: { examRoomId, userId: { in: notSubmitted.map((p) => p.userId) } },
          select: { userId: true },
          distinct: ['userId'],
        })
      ).map((a) => a.userId),
    ),
  );

  if (answeredUserIds.length === 0) return;

  // Mark all as submitted
  await prisma.examParticipant.updateMany({
    where: { examRoomId, userId: { in: answeredUserIds } },
    data: { status: 'SUBMITTED' },
  });

  const examRoomInfo = await prisma.examRoom.findFirst({
    where: { id: examRoomId },
    select: { examId: true, exam: true },
  });
  const passingGrade = examRoomInfo?.exam?.passingGrade ?? 75;

  const examQuestions = await prisma.examQuestion.findMany({
    where: { examRoomId, deletedAt: null },
    include: { question: { include: { correctAnswer: true } } },
  });

  const allMC =
    examQuestions.length > 0 &&
    examQuestions.every((eq) => eq.question?.type === 'MULTIPLE_CHOICE');

  if (allMC) {
    const allAnswers = await prisma.examAnswer.findMany({
      where: { examRoomId, userId: { in: answeredUserIds } },
    });

    const userScores: { userId: string; score: number; passed: boolean }[] = [];
    const logsData: { examRoomId: string; userId: string; type: string; message: string }[] = [];

    for (const userId of answeredUserIds) {
      const userAnswers = allAnswers.filter((a) => a.userId === userId);
      const answerMap = new Map(userAnswers.map((a) => [a.questionId, a.optionId]));

      let correct = 0;
      for (const eq of examQuestions) {
        const correctOptionId = eq.question?.correctAnswer?.optionId;
        const participantOptionId = answerMap.get(eq.questionId);
        if (correctOptionId && participantOptionId === correctOptionId) correct++;
      }
      const score = examQuestions.length > 0 ? Math.round((correct / examQuestions.length) * 100) : 0;
      const passed = score >= passingGrade;

      userScores.push({ userId, score, passed });
      logsData.push({
        examRoomId,
        userId,
        type: 'submit',
        message: `Peserta otomatis dikumpulkan oleh sistem. Skor: ${score}.`,
      });
      redisClient.set(`exam_submitted:${examRoomId}:${userId}`, '1');
    }

    // Upsert isn't directly supported in createMany, so we fetch existing ones
    const existingScores = await prisma.examScore.findMany({
      where: { examRoomId, userId: { in: answeredUserIds } },
    });
    const existingUserIds = new Set(existingScores.map((s) => s.userId));

    const toCreate = userScores
      .filter((s) => !existingUserIds.has(s.userId))
      .map((s) => ({ examRoomId, ...s }));

    if (toCreate.length > 0) {
      await prisma.examScore.createMany({ data: toCreate });
    }

    for (const s of userScores.filter((s) => existingUserIds.has(s.userId))) {
      await prisma.examScore.updateMany({
        where: { examRoomId, userId: s.userId },
        data: { score: s.score, passed: s.passed },
      });
    }

    await prisma.examLog.createMany({ data: logsData });
  } else {
    // Non-MC (Essay or Mixed)
    const existingScores = await prisma.examScore.findMany({
      where: { examRoomId, userId: { in: answeredUserIds } },
    });
    const existingUserIds = new Set(existingScores.map((s) => s.userId));

    const toCreate = answeredUserIds
      .filter((id) => !existingUserIds.has(id))
      .map((id) => ({ examRoomId, userId: id, score: null }));
    if (toCreate.length > 0) {
      await prisma.examScore.createMany({ data: toCreate });
    }

    const logsData = answeredUserIds.map((userId) => {
      redisClient.set(`exam_submitted:${examRoomId}:${userId}`, '1');
      return {
        examRoomId,
        userId,
        type: 'submit',
        message: 'Peserta otomatis dikumpulkan oleh sistem. Menunggu koreksi esai.',
      };
    });
    await prisma.examLog.createMany({ data: logsData });
  }
};
