import { Router } from "express";
import { prisma } from "#exam/database/index.js";
import { validate } from "#exam/middleware/validate.js";
import { ExamAnswerRepository } from "./exam-answer.repository.js";
import { ExamAnswerService } from "./exam-answer.service.js";
import { ExamAnswerController } from "./exam-answer.controller.js";
import { createExamAnswerSchema, updateExamAnswerSchema } from "./exam-answer.schema.js";

const repository = new ExamAnswerRepository(prisma);
const service = new ExamAnswerService(repository);
const controller = new ExamAnswerController(service);

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createExamAnswerSchema), controller.create);
router.patch("/:id", validate(updateExamAnswerSchema), controller.updateById);
router.delete("/:id", controller.deleteById);

export default router;
