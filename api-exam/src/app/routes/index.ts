import { readFileSync } from "fs";
import { join } from "path";
import { type Application, type Request, type Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { now, formatWIB } from "../../utils/datetime.js";
import authRouter from "../../modules/auth/auth.routes.js";
import userRouter from "../../modules/user/user.routes.js";
import loginAuditRouter from "../../modules/login-audit/login-audit.routes.js";
import roomRouter from "../../modules/room/room.routes.js";
import examRouter from "../../modules/exam/exam.routes.js";
import examRoomRouter from "../../modules/exam-room/exam-room.routes.js";
import examParticipantRouter from "../../modules/exam-participant/exam-participant.routes.js";
import examSupervisorRouter from "../../modules/exam-supervisor/exam-supervisor.routes.js";
import questionRouter from "../../modules/question/question.routes.js";
import optionRouter from "../../modules/option/option.routes.js";
import questionCorrectAnswerRouter from "../../modules/question-correct-answer/question-correct-answer.routes.js";
import examQuestionRouter from "../../modules/exam-question/exam-question.routes.js";
import examAnswerRouter from "../../modules/exam-answer/exam-answer.routes.js";
import examScoreRouter from "../../modules/exam-score/exam-score.routes.js";
import examSessionRouter from "../../modules/exam-session/exam-session.routes.js";
import examLogRouter from "../../modules/exam-log/exam-log.routes.js";
import essayGradeRouter from "../../modules/essay-grade/essay-grade.routes.js";
import chatRouter from "../../modules/chat/chat.routes.js";
import notificationRouter from "../../modules/notification/notification.routes.js";

interface PackageJson {
  name: string;
  description: string;
}

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8")) as PackageJson;

const buildHealthPayload = () => ({
  name: pkg.name,
  description: pkg.description,
  status: "OK",
  timestamp: formatWIB(now()),
});

const rootHealthHandler = (_request: Request, response: Response): void => {
  sendSuccess({
    response,
    data: buildHealthPayload(),
    message: "API health checking successfully",
  });
};

const apiHealthHandler = (_request: Request, response: Response): void => {
  sendSuccess({
    response,
    data: buildHealthPayload(),
    message: "API health checking successfully",
  });
};

export const registerRoutes = (app: Application): void => {
  app.get("/", rootHealthHandler);
  app.get("/api/", apiHealthHandler);
  app.get("/api/v1", apiHealthHandler);

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/login-audits", loginAuditRouter);
  app.use("/api/v1/rooms", roomRouter);
  app.use("/api/v1/exams", examRouter);
  app.use("/api/v1/exam-rooms", examRoomRouter);
  app.use("/api/v1/exam-participants", examParticipantRouter);
  app.use("/api/v1/exam-supervisors", examSupervisorRouter);
  app.use("/api/v1/questions", questionRouter);
  app.use("/api/v1/options", optionRouter);
  app.use("/api/v1/question-correct-answers", questionCorrectAnswerRouter);
  app.use("/api/v1/exam-questions", examQuestionRouter);
  app.use("/api/v1/exam-answers", examAnswerRouter);
  app.use("/api/v1/exam-scores", examScoreRouter);
  app.use("/api/v1/exam-sessions", examSessionRouter);
  app.use("/api/v1/exam-logs", examLogRouter);
  app.use("/api/v1/essay-grades", essayGradeRouter);
  app.use("/api/v1/chats", chatRouter);
  app.use("/api/v1/notifications", notificationRouter);
};
