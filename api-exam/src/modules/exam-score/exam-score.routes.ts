import { Router } from "express";
import { prisma } from "../../app/database/index.js";
import { validate } from "../../app/middlewares/validate.js";
import { ExamScoreRepository } from "./exam-score.repository.js";
import { ExamScoreService } from "./exam-score.service.js";
import { ExamScoreController } from "./exam-score.controller.js";
import { createExamScoreSchema, updateExamScoreSchema } from "./exam-score.schema.js";

const repository = new ExamScoreRepository(prisma);
const service = new ExamScoreService(repository);
const controller = new ExamScoreController(service);

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createExamScoreSchema), controller.create);
router.patch("/:id", validate(updateExamScoreSchema), controller.updateById);
router.delete("/:id", controller.deleteById);

export default router;
