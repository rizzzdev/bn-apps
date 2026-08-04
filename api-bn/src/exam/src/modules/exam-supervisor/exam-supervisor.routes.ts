import { Router } from 'express';
import { prisma } from '#exam/database/index.js';
import { validate } from '#exam/middleware/validate.js';
import { ExamSupervisorRepository } from './exam-supervisor.repository.js';
import { ExamSupervisorService } from './exam-supervisor.service.js';
import { ExamSupervisorController } from './exam-supervisor.controller.js';
import {
  createExamSupervisorSchema,
  updateExamSupervisorSchema,
} from './exam-supervisor.schema.js';
import { asyncHandler } from '#exam/utils/asyncHandler.js';
import { sendResponse } from '#app/index.js';
import { NotificationRepository } from '#exam/modules/notification/index.js';

const repository = new ExamSupervisorRepository(prisma);
const notificationRepo = new NotificationRepository(prisma);
const service = new ExamSupervisorService(repository, notificationRepo);
const controller = new ExamSupervisorController(service);

const router = Router();

router.get('/', controller.getAll);

// User IDs already supervising another exam whose schedule overlaps this exam
// room's exam. Used to filter the "Tambah Pengawas" candidate list.
router.get(
  '/busy-user-ids',
  asyncHandler(async (req, res) => {
    const examRoomId = req.query.examRoomId as string | undefined;
    if (!examRoomId) {
      sendResponse(res, 200, 'examRoomId wajib diisi.', []);
      return;
    }

    const examRoom = await prisma.examRoom.findUnique({
      where: { id: examRoomId },
      include: { exam: true },
    });
    if (!examRoom) {
      sendResponse(res, 200, 'Ruangan ujian tidak ditemukan.', []);
      return;
    }

    const { startTime, endTime } = examRoom.exam;

    const busySupervisors = await prisma.examSupervisor.findMany({
      where: {
        examRoomId: { not: examRoomId },
        examRoom: {
          exam: {
            startTime: { lte: endTime },
            endTime: { gte: startTime },
          },
        },
      },
      select: { userId: true },
    });

    sendResponse(res, 200, 'Get busy user ids successfully.', [
      ...new Set(busySupervisors.map((s) => s.userId)),
    ]);
  }),
);

router.get('/:id', controller.getById);
router.post('/', validate(createExamSupervisorSchema), controller.create);
router.patch('/:id', validate(updateExamSupervisorSchema), controller.updateById);
router.delete('/:id', controller.deleteById);

export default router;
