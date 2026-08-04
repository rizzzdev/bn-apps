import { Router } from 'express';
import { validate } from '#exam/middleware/validate.js';
import { ExamSessionService } from './exam-session.service.js';
import { ExamSessionController } from './exam-session.controller.js';
import { updateProgressSchema } from './exam-session.schema.js';

const service = new ExamSessionService();
const controller = new ExamSessionController(service);

const router = Router();

router.get('/:examRoomId', controller.getSession);
router.put('/:examRoomId/progress', validate(updateProgressSchema), controller.updateProgress);

export default router;
