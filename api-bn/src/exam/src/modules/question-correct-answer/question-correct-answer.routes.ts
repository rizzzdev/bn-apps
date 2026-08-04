import { Router } from "express";
import { prisma } from "#exam/database/index.js";
import { validate } from "#exam/middleware/validate.js";
import { QuestionCorrectAnswerRepository } from "./question-correct-answer.repository.js";
import { QuestionCorrectAnswerService } from "./question-correct-answer.service.js";
import { QuestionCorrectAnswerController } from "./question-correct-answer.controller.js";
import {
  createQuestionCorrectAnswerSchema,
  updateQuestionCorrectAnswerSchema,
} from "./question-correct-answer.schema.js";

const repository = new QuestionCorrectAnswerRepository(prisma);
const service = new QuestionCorrectAnswerService(repository);
const controller = new QuestionCorrectAnswerController(service);

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createQuestionCorrectAnswerSchema), controller.create);
router.patch("/:id", validate(updateQuestionCorrectAnswerSchema), controller.updateById);
router.delete("/:id", controller.deleteById);

export default router;
