import { Router } from "express";
import { prisma } from "../../app/database/index.js";
import { validate } from "../../app/middlewares/validate.js";
import { ExamRepository } from "./exam.repository.js";
import { ExamService } from "./exam.service.js";
import { ExamController } from "./exam.controller.js";
import { createExamSchema, updateExamSchema } from "./exam.schema.js";

const repository = new ExamRepository(prisma);
const service = new ExamService(repository);
const controller = new ExamController(service);

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createExamSchema), controller.create);
router.patch("/:id", validate(updateExamSchema), controller.updateById);
router.delete("/:id", controller.deleteById);

export default router;
