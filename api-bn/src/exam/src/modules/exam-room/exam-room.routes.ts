import { Router } from 'express';
import { prisma } from '#exam/database/index.js';
import { redisClient } from '#exam/configs/redis.config.js';
import { validate } from '#exam/middleware/validate.js';
import { ExamRoomRepository } from './exam-room.repository.js';
import { ExamRoomService } from './exam-room.service.js';
import { ExamRoomController } from './exam-room.controller.js';
import { createExamRoomSchema, updateExamRoomSchema } from './exam-room.schema.js';
import { asyncHandler } from '#exam/utils/asyncHandler.js';
import { sendResponse } from '#app/index.js';
import { ExamLogRepository } from '#exam/modules/exam-log/exam-log.repository.js';
import { submitParticipant } from './exam-room.submit.js';
import { notifyUsers } from '#exam/modules/notification/index.js';

const examLogRepo = new ExamLogRepository(prisma);

const repository = new ExamRoomRepository(prisma);
const service = new ExamRoomService(repository);
const controller = new ExamRoomController(service);

const router = Router();

router.get('/', controller.getAll);

// Remaining capacity per room for the given exam's time slot (used by the
// "Tambah Ruangan" form so admins can see available seats before picking a room).
router.get(
  '/availability',
  asyncHandler(async (req, res) => {
    const examId = req.query.examId as string | undefined;
    if (!examId) {
      sendResponse(res, 200, 'examId wajib diisi.', []);
      return;
    }

    const exam = await prisma.exam.findFirst({ where: { id: examId } });
    if (!exam) {
      sendResponse(res, 200, 'Ujian tidak ditemukan.', []);
      return;
    }

    const rooms = await prisma.room.findMany({ where: { deletedAt: null } });

    const availability = await Promise.all(
      rooms.map(async (room) => {
        if (room.capacity === null) {
          return { roomId: room.id, capacity: null, occupied: 0, remaining: null };
        }

        const overlappingExamRooms = await prisma.examRoom.findMany({
          where: {
            roomId: room.id,
            exam: {
              startTime: { lte: exam.endTime },
              endTime: { gte: exam.startTime },
            },
          },
          select: { id: true },
        });

        const occupied = await prisma.examParticipant.count({
          where: { examRoomId: { in: overlappingExamRooms.map((er) => er.id) } },
        });

        return {
          roomId: room.id,
          capacity: room.capacity,
          occupied,
          remaining: Math.max(0, room.capacity - occupied),
        };
      }),
    );

    sendResponse(res, 200, 'Get room availability successfully.', availability);
  }),
);

router.get(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const [startedAt, examRoom] = await Promise.all([
      redisClient.get(`exam_started:${id}`),
      prisma.examRoom.findFirst({ where: { id }, select: { status: true } }),
    ]);
    sendResponse(res, 200, 'Get exam room status successfully.', {
      started: !!startedAt,
      startedAt: startedAt ?? null,
      status: examRoom?.status ?? 'PENDING',
    });
  }),
);

router.get(
  '/:id/submit-status',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      sendResponse(res, 200, 'No userId.', { submitted: false });
      return;
    }
    const submitted = !!(await redisClient.get(`exam_submitted:${id}:${userId}`));
    sendResponse(res, 200, 'Get submit status successfully.', { submitted });
  }),
);

router.post(
  '/:id/submit',
  asyncHandler(async (req, res) => {
    const examRoomId = req.params.id as string;
    const { userId } = req.body as { userId: string };

    if (!userId) {
      res.status(400).json({ error: true, message: 'userId required.' });
      return;
    }

    const result = await submitParticipant(examRoomId, userId);

    if (!result.submitted) {
      res.status(409).json({ error: true, message: 'Ujian ini sudah Anda kumpulkan sebelumnya.' });
      return;
    }

    sendResponse(
      res,
      200,
      result.autoScored
        ? 'Ujian dikumpulkan dan skor dihitung otomatis.'
        : 'Ujian dikumpulkan. Menunggu koreksi esai.',
      result,
    );
  }),
);

// Compute final score for a participant (handles mixed MC+Essay exams)
router.post(
  '/:id/grade/:userId',
  asyncHandler(async (req, res) => {
    const examRoomId = req.params.id as string;
    const userId = req.params.userId as string;
    const body = (req.body ?? {}) as { mcWeight?: number; essayWeight?: number };
    const { mcWeight, essayWeight } = body;

    // Persist weights only when the caller explicitly sends BOTH — a plain
    // recalculation (or a partial payload) must reuse the stored bobot.
    const hasExplicitWeights = mcWeight !== undefined && essayWeight !== undefined;

    // Load the exam room together with its exam so we can fall back to the
    // weights that were already set (e.g. during "Koreksi Esai") instead of
    // silently resetting them to 100% MC / 0% essay on every recalculation.
    const examRoom = await prisma.examRoom.findFirst({
      where: { id: examRoomId },
      select: { examId: true, exam: true },
    });
    if (!examRoom) {
      res.status(404).json({ error: true, message: 'Ruangan ujian tidak ditemukan.' });
      return;
    }

    const mw = mcWeight ?? examRoom.exam.mcWeight ?? 1;
    const ew = essayWeight ?? examRoom.exam.essayWeight ?? 0;

    if (Math.abs(mw + ew - 1) > 0.001) {
      res.status(400).json({ error: true, message: 'mcWeight + essayWeight must equal 1.' });
      return;
    }

    if (hasExplicitWeights) {
      // Persist the bobot on the exam (shared across all rooms of this exam).
      await prisma.exam.update({
        where: { id: examRoom.examId },
        data: { mcWeight: mw, essayWeight: ew },
      });
      // Invalidate the cached exam list so other screens pick up the new bobot.
      await redisClient.incr('cache_version:exam');
    }

    // Fetch all exam questions
    const examQuestions = await prisma.examQuestion.findMany({
      where: { examRoomId, deletedAt: null },
      include: { question: { include: { correctAnswer: true } } },
    });

    const mcQuestions = examQuestions.filter((eq) => eq.question?.type === 'MULTIPLE_CHOICE');
    const essayQuestions = examQuestions.filter((eq) => eq.question?.type === 'ESSAY');

    // MC score
    let mcScore = 0;
    if (mcQuestions.length > 0) {
      const answers = await prisma.examAnswer.findMany({ where: { examRoomId, userId } });
      const answerMap = new Map(answers.map((a) => [a.questionId, a.optionId]));
      let correct = 0;
      for (const eq of mcQuestions) {
        const correctOptionId = eq.question?.correctAnswer?.optionId;
        if (correctOptionId && answerMap.get(eq.questionId) === correctOptionId) correct++;
      }
      mcScore = Math.round((correct / mcQuestions.length) * 100);
    }

    // Essay score
    let essayScore = 0;
    if (essayQuestions.length > 0) {
      const grades = await prisma.essayGrade.findMany({ where: { examRoomId, userId } });
      const gradeMap = new Map(grades.map((g) => [g.questionId, g.points]));
      const totalPoints = essayQuestions.reduce(
        (sum, eq) => sum + (gradeMap.get(eq.questionId) ?? 0),
        0,
      );
      const maxPoints = essayQuestions.length * 10;
      essayScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    }

    // Final score
    const finalScore = Math.round(mcScore * mw + essayScore * ew);

    const examData = examRoom.exam;
    const passingGrade = examData.passingGrade ?? 75;
    const passed = finalScore >= passingGrade;

    const existing = await prisma.examScore.findFirst({ where: { examRoomId, userId } });
    if (existing) {
      await prisma.examScore.update({
        where: { id: existing.id },
        data: { score: finalScore, passed },
      });
    } else {
      await prisma.examScore.create({
        data: { examRoomId, userId, score: finalScore, passed },
      });
    }

    void notifyUsers(
      prisma,
      [userId],
      'score_ready',
      'Nilai Keluar',
      `Nilai ujian "${examData.name ?? ''}" Anda: ${finalScore} (${passed ? 'Lulus' : 'Tidak Lulus'}).`,
      examData.name ?? undefined,
    );

    sendResponse(res, 200, 'Nilai berhasil dihitung.', {
      score: finalScore,
      mcScore,
      essayScore,
      mcWeight: mw,
      essayWeight: ew,
      passed,
    });
  }),
);

router.get('/:id', controller.getById);
router.get('/:id/participants-status', controller.getParticipantsStatus);
router.post('/', validate(createExamRoomSchema), controller.create);
router.patch('/:id', validate(updateExamRoomSchema), controller.updateById);
router.delete('/:id', controller.deleteById);

export default router;
