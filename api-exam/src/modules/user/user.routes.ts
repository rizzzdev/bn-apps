import { Router } from "express";
import multer from "multer";
import { prisma } from "../../app/database/index.js";
import { validate } from "../../app/middlewares/validate.js";
import { UserRepository } from "./user.repository.js";
import { UserService } from "./user.service.js";
import { UserController } from "./user.controller.js";
import { createUserSchema, updateUserSchema } from "./user.schema.js";

const repository = new UserRepository(prisma);
const service = new UserService(repository);
const controller = new UserController(service);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

router.get("/", controller.getAll);
router.get("/template", controller.downloadTemplate);
router.get("/:id", controller.getById);
router.post("/", validate(createUserSchema), controller.create);
router.post("/import", upload.single("file"), controller.importExcel);
router.patch("/:id", validate(updateUserSchema), controller.updateById);
router.delete("/:id", controller.deleteById);

export default router;
