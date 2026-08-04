import { Router } from "express";
import { prisma } from "../../app/database/index.js";
import { validate } from "../../app/middlewares/validate.js";
import { LoginAuditRepository } from "./login-audit.repository.js";
import { LoginAuditService } from "./login-audit.service.js";
import { LoginAuditController } from "./login-audit.controller.js";
import { createLoginAuditSchema, updateLoginAuditSchema } from "./login-audit.schema.js";

const repository = new LoginAuditRepository(prisma);
const service = new LoginAuditService(repository);
const controller = new LoginAuditController(service);

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createLoginAuditSchema), controller.create);
router.patch("/:id", validate(updateLoginAuditSchema), controller.updateById);
router.delete("/:id", controller.deleteById);

export default router;
