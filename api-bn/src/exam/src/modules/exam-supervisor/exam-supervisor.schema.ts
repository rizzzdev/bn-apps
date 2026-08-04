import { z } from 'zod';

export const createExamSupervisorSchema = z.strictObject({
  examRoomId: z.string().min(1, 'Exam room ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export const updateExamSupervisorSchema = createExamSupervisorSchema.partial();
