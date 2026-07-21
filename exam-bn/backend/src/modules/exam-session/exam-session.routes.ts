import { Router } from "express";
import { validate } from "../../app/middlewares/validate.js";
import { authenticate } from "../auth/auth.middleware.js";
import { ExamSessionService } from "./exam-session.service.js";
import { ExamSessionController } from "./exam-session.controller.js";
import { updateProgressSchema } from "./exam-session.schema.js";

const service = new ExamSessionService();
const controller = new ExamSessionController(service);

const router = Router();

router.use(authenticate);

router.get("/:examRoomId", controller.getSession);
router.put("/:examRoomId/progress", validate(updateProgressSchema), controller.updateProgress);

export default router;
