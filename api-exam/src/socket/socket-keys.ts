// Redis key helpers shared between socket.handler.ts and exam-lifecycle.ts.
export const redisKeys = {
  session: (examRoomId: string, userId: string) => `exam_session:${examRoomId}:${userId}`,
  lock: (examRoomId: string, userId: string) => `exam_lock:${examRoomId}:${userId}`,
  violations: (examRoomId: string, userId: string) => `exam_violations:${examRoomId}:${userId}`,
  socketId: (examRoomId: string, userId: string) => `exam_socket:${examRoomId}:${userId}`,
  supervisorRoom: (examRoomId: string) => `supervisor:${examRoomId}`,
  participantRoom: (examRoomId: string) => `exam:${examRoomId}`,
  started: (examRoomId: string) => `exam_started:${examRoomId}`,
  userRoom: (userId: string) => `user:${userId}`,
};
