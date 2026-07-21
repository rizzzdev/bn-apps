import { Router } from "express";
import { prisma } from "../../app/database/index.js";
import { redisClient } from "../../configs/redis.config.js";
import { validate } from "../../app/middlewares/validate.js";
import { ExamRoomRepository } from "./exam-room.repository.js";
import { ExamRoomService } from "./exam-room.service.js";
import { ExamRoomController } from "./exam-room.controller.js";
import { createExamRoomSchema, updateExamRoomSchema } from "./exam-room.schema.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { ExamLogRepository } from "../exam-log/exam-log.repository.js";
import { submitParticipant } from "./exam-room.submit.js";
import { notifyUsers } from "../notification/index.js";

const examLogRepo = new ExamLogRepository(prisma);

const repository = new ExamRoomRepository(prisma);
const service = new ExamRoomService(repository);
const controller = new ExamRoomController(service);

const router = Router();

router.get("/", controller.getAll);

// Remaining capacity per room for the given exam's time slot (used by the
// "Tambah Ruangan" form so admins can see available seats before picking a room).
router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const examId = req.query.examId as string | undefined;
    if (!examId) {
      sendSuccess({ response: res, data: [], message: "examId wajib diisi." });
      return;
    }

    const exam = await prisma.exam.findFirst({ where: { id: examId } });
    if (!exam) {
      sendSuccess({ response: res, data: [], message: "Ujian tidak ditemukan." });
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

    sendSuccess({
      response: res,
      data: availability,
      message: "Get room availability successfully.",
    });
  }),
);

router.get(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const [startedAt, examRoom] = await Promise.all([
      redisClient.get(`exam_started:${id}`),
      prisma.examRoom.findFirst({ where: { id }, select: { status: true } }),
    ]);
    sendSuccess({
      response: res,
      data: {
        started: !!startedAt,
        startedAt: startedAt ?? null,
        status: examRoom?.status ?? "PENDING",
      },
      message: "Get exam room status successfully.",
    });
  }),
);

router.get(
  "/:id/submit-status",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      sendSuccess({ response: res, data: { submitted: false }, message: "No userId." });
      return;
    }
    const submitted = !!(await redisClient.get(`exam_submitted:${id}:${userId}`));
    sendSuccess({ response: res, data: { submitted }, message: "Get submit status successfully." });
  }),
);

router.post(
  "/:id/submit",
  asyncHandler(async (req, res) => {
    const examRoomId = req.params.id as string;
    const { userId } = req.body as { userId: string };

    if (!userId) {
      res.status(400).json({ error: true, message: "userId required." });
      return;
    }

    const result = await submitParticipant(examRoomId, userId);

    if (!result.submitted) {
      res.status(409).json({ error: true, message: "Ujian ini sudah Anda kumpulkan sebelumnya." });
      return;
    }

    sendSuccess({
      response: res,
      data: result,
      message: result.autoScored
        ? "Ujian dikumpulkan dan skor dihitung otomatis."
        : "Ujian dikumpulkan. Menunggu koreksi esai.",
    });
  }),
);

// Compute final score for a participant (handles mixed MC+Essay exams)
router.post(
  "/:id/grade/:userId",
  asyncHandler(async (req, res) => {
    const examRoomId = req.params.id as string;
    const userId = req.params.userId as string;
    const { mcWeight, essayWeight } = req.body as { mcWeight?: number; essayWeight?: number };

    const mw = mcWeight ?? 1;
    const ew = essayWeight ?? 0;

    if (Math.abs(mw + ew - 1) > 0.001) {
      res.status(400).json({ error: true, message: "mcWeight + essayWeight must equal 1." });
      return;
    }

    // Save weights on the exam (shared across all rooms of this exam)
    const examRoom = await prisma.examRoom.findFirst({
      where: { id: examRoomId },
      select: { examId: true },
    });
    if (examRoom) {
      await prisma.exam.update({
        where: { id: examRoom.examId },
        data: { mcWeight: mw, essayWeight: ew },
      });
    }

    // Fetch all exam questions
    const examQuestions = await prisma.examQuestion.findMany({
      where: { examRoomId, deletedAt: null },
      include: { question: { include: { correctAnswer: true } } },
    });

    const mcQuestions = examQuestions.filter((eq) => eq.question?.type === "MULTIPLE_CHOICE");
    const essayQuestions = examQuestions.filter((eq) => eq.question?.type === "ESSAY");

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

    const examData = examRoom
      ? await prisma.exam.findFirst({ where: { id: examRoom.examId } })
      : null;
    const passingGrade = examData?.passingGrade ?? 75;
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
      "score_ready",
      "Nilai Keluar",
      `Nilai ujian "${examData?.name ?? ""}" Anda: ${finalScore} (${passed ? "Lulus" : "Tidak Lulus"}).`,
      examData?.name ?? undefined,
    );

    sendSuccess({
      response: res,
      data: { score: finalScore, mcScore, essayScore, mcWeight: mw, essayWeight: ew, passed },
      message: "Nilai berhasil dihitung.",
    });
  }),
);

router.get("/:id", controller.getById);
router.get("/:id/participants-status", controller.getParticipantsStatus);
router.post("/", validate(createExamRoomSchema), controller.create);
router.patch("/:id", validate(updateExamRoomSchema), controller.updateById);
router.delete("/:id", controller.deleteById);

export default router;
