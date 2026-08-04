import {
  type Exam as ExamBase,
  type ExamRoom as ExamRoomBase,
} from '#exam/database/index.js';
import { type z } from 'zod';
import { type createExamSchema, type updateExamSchema } from './exam.schema.js';

export type Exam = ExamBase & {
  examRooms?: ExamRoomBase[];
};

export type CreateExamDto = z.infer<typeof createExamSchema>;
export type UpdateExamDto = z.infer<typeof updateExamSchema>;
