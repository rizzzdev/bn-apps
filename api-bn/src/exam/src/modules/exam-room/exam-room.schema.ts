import { z } from 'zod';

export const createExamRoomSchema = z.strictObject({
  examId: z.string().min(1, 'Exam ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  classIds: z.array(z.string()).optional(),
});

export const updateExamRoomSchema = createExamRoomSchema.partial();
