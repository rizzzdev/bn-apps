import { Router } from 'express';
import { prisma } from '#exam/database/index.js';
import { validate } from '#exam/middleware/validate.js';
import { ExamParticipantRepository } from './exam-participant.repository.js';
import { ExamParticipantService } from './exam-participant.service.js';
import { ExamParticipantController } from './exam-participant.controller.js';
import {
  createExamParticipantSchema,
  updateExamParticipantSchema,
} from './exam-participant.schema.js';
import { asyncHandler } from '#exam/utils/asyncHandler.js';
import { sendResponse } from '#app/index.js';
import { NotificationRepository } from '#exam/modules/notification/index.js';

const repository = new ExamParticipantRepository(prisma);
const notificationRepo = new NotificationRepository(prisma);
const service = new ExamParticipantService(repository, notificationRepo);
const controller = new ExamParticipantController(service);

const router = Router();

router.get('/', controller.getAll);

// User IDs already enrolled in another exam whose schedule overlaps this exam
// room's exam. Used to filter the "Tambah Peserta" candidate list.
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

    const busyParticipants = await prisma.examParticipant.findMany({
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
      ...new Set(busyParticipants.map((p) => p.userId)),
    ]);
  }),
);

router.get('/:id', controller.getById);
router.post('/', validate(createExamParticipantSchema), controller.create);
router.patch('/:id', validate(updateExamParticipantSchema), controller.updateById);
router.delete('/:id', controller.deleteById);

export default router;
