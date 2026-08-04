import { Router } from "express";
import { prisma } from "#exam/database/index.js";
import { validate } from "#exam/middleware/validate.js";
import { ExamQuestionRepository } from "./exam-question.repository.js";
import { ExamQuestionService } from "./exam-question.service.js";
import { ExamQuestionController } from "./exam-question.controller.js";
import { createExamQuestionSchema, updateExamQuestionSchema } from "./exam-question.schema.js";

const repository = new ExamQuestionRepository(prisma);
const service = new ExamQuestionService(repository);
const controller = new ExamQuestionController(service);

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createExamQuestionSchema), controller.create);
router.patch("/:id", validate(updateExamQuestionSchema), controller.updateById);
router.delete("/:id", controller.deleteById);

export default router;
