import { type ExamSupervisor as ExamSupervisorBase } from '#exam/database/index.js';
import { type z } from 'zod';
import {
  type createExamSupervisorSchema,
  type updateExamSupervisorSchema,
} from './exam-supervisor.schema.js';

export type ExamSupervisor = ExamSupervisorBase;

export type CreateExamSupervisorDto = z.infer<typeof createExamSupervisorSchema>;
export type UpdateExamSupervisorDto = z.infer<typeof updateExamSupervisorSchema>;
