import { type ExamSession } from '#exam/socket/socket.types.js';

export type { ExamSession };

export type UpdateProgressDto = {
  currentQuestionIndex: number;
};
