import { Router } from "express";
import { prisma } from "../../app/database/index.js";
import { validate } from "../../app/middlewares/validate.js";
import { UserRepository } from "../user/user.repository.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import { loginSchema } from "./auth.schema.js";

const userRepository = new UserRepository(prisma);
const service = new AuthService(userRepository);
const controller = new AuthController(service);

const router = Router();

router.post("/login", validate(loginSchema), controller.login);
router.post("/logout", authenticate, controller.logout);
router.get("/me", authenticate, controller.me);
router.post("/access-token", controller.refreshAccessToken);

export default router;
