import { Router } from "express";
import { prisma } from "#exam/database/index.js";
import { validate } from "#exam/middleware/validate.js";
import { OptionRepository } from "./option.repository.js";
import { OptionService } from "./option.service.js";
import { OptionController } from "./option.controller.js";
import { createOptionSchema, updateOptionSchema } from "./option.schema.js";

const repository = new OptionRepository(prisma);
const service = new OptionService(repository);
const controller = new OptionController(service);

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createOptionSchema), controller.create);
router.patch("/:id", validate(updateOptionSchema), controller.updateById);
router.delete("/:id", controller.deleteById);

export default router;
