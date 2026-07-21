import { type ExamSession } from "../../socket/socket.types.js";

export type { ExamSession };

export type UpdateProgressDto = {
  currentQuestionIndex: number;
};
