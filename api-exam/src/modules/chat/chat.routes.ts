import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../../app/database/index.js";
import { authenticate } from "../auth/auth.middleware.js";
import { ForbiddenError, BadRequestError } from "../../utils/errors.js";
import { ChatRepository } from "./chat.repository.js";
import { sendSuccess } from "../../utils/response.js";

const router = Router();
const repo = new ChatRepository(prisma);

const ensureChatRole = (role?: string): "ADMIN" | "SUPERVISOR" => {
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    throw new ForbiddenError("Hanya admin dan pengawas yang dapat menggunakan chat ini.");
  }
  return role;
};

router.get(
  "/contacts",
  authenticate,
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const role = ensureChatRole(request.user?.role);
      const oppositeRole = role === "ADMIN" ? "SUPERVISOR" : "ADMIN";
      const contacts = await repo.getContacts(oppositeRole);
      sendSuccess({ response, data: contacts });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/conversations",
  authenticate,
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      ensureChatRole(request.user?.role);
      const conversations = await repo.getConversations(request.user!.id);
      sendSuccess({ response, data: conversations });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/conversations/:otherUserId",
  authenticate,
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      ensureChatRole(request.user?.role);
      const otherUserId = String(request.params.otherUserId ?? "");
      if (!otherUserId) throw new BadRequestError("ID lawan bicara wajib diisi.");

      const messages = await repo.getConversation(request.user!.id, otherUserId);
      await repo.markRead(request.user!.id, otherUserId);
      sendSuccess({ response, data: messages });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
