export enum ViolationType {
  TAB_SWITCH = "TAB_SWITCH",
  WINDOW_BLUR = "WINDOW_BLUR",
  WINDOW_CLOSED = "WINDOW_CLOSED",
  FULLSCREEN_EXIT = "FULLSCREEN_EXIT",
  COPY_PASTE = "COPY_PASTE",
  RIGHT_CLICK = "RIGHT_CLICK",
}

export type ExamSession = {
  userId: string;
  username: string;
  examRoomId: string;
  startedAt: string;
  currentQuestionIndex: number;
  isLocked: boolean;
  violationCount: number;
  lastViolationType: ViolationType | null;
};

export type ParticipantStatus = {
  userId: string;
  username: string;
  fullname: string;
  isLocked: boolean;
  violationCount: number;
  lastViolationType: ViolationType | null;
  isOnline: boolean;
};

export type ReplyPreview = {
  id: string;
  senderName: string;
  message: string;
};

export type ClientToServerEvents = {
  "exam:join": (payload: { examRoomId: string }) => void;
  "exam:supervisor:join": (payload: { examRoomId: string }) => void;
  "exam:monitor:join": (payload: { examRoomId: string }) => void;
  "exam:status:subscribe": (payload: { examRoomIds: string[] }) => void;
  "exam:violation": (payload: { examRoomId: string; violationType: ViolationType }) => void;
  "exam:unlock": (payload: { examRoomId: string; participantUserId: string }) => void;
  "exam:start": (payload: { examRoomId: string }) => void;
  "exam:warn": (payload: { examRoomId: string; targetUserId: string; message: string }) => void;
  "chat:send": (payload: { receiverId: string; message: string; replyToId?: string }) => void;
  "chat:history": (payload: { otherUserId: string }) => void;
};

export type ChatMessagePayload = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  message: string;
  timestamp: string;
  replyToId: string | null;
  replyTo: ReplyPreview | null;
};

export type ServerToClientEvents = {
  "exam:session": (payload: ExamSession) => void;
  "exam:locked": (payload: {
    reason: string;
    violationType: ViolationType;
    violationCount: number;
  }) => void;
  "exam:unlocked": () => void;
  "exam:started": (payload: {
    examRoomId: string;
    startedAt: string;
    examName?: string;
    roomName?: string;
  }) => void;
  "exam:ended": (payload: {
    examRoomId: string;
    endedAt: string;
    examName?: string;
    roomName?: string;
  }) => void;
  "exam:participant:violated": (payload: {
    userId: string;
    username: string;
    fullname: string;
    violationType: ViolationType;
    violationCount: number;
    examRoomId?: string;
    examName?: string;
    roomName?: string;
  }) => void;
  "exam:participant:joined": (payload: {
    userId: string;
    username: string;
    fullname: string;
    examRoomId: string;
    examName: string;
    roomName: string;
  }) => void;
  "exam:participant:disconnected": (payload: {
    userId: string;
    username: string;
    fullname: string;
    examRoomId: string;
    examName?: string;
    roomName?: string;
    isGracePeriod?: boolean;
  }) => void;
  "exam:participant:warned": (payload: { userId: string; fullname: string }) => void;
  "exam:room:status": (payload: ParticipantStatus[]) => void;
  "exam:participant:answer_updated": (payload: {
    userId: string;
    questionId: string;
    answerId: string;
    optionId?: string | null;
    text?: string | null;
  }) => void;
  "exam:error": (payload: { message: string }) => void;
  "exam:warn": (payload: { message: string; fromName: string }) => void;
  "chat:message": (payload: ChatMessagePayload) => void;
  "chat:history": (payload: { otherUserId: string; messages: ChatMessagePayload[] }) => void;
  "chat:notify": (payload: {
    senderId: string;
    senderName: string;
    senderRole: string;
    message: string;
    timestamp: string;
  }) => void;
  "online:count": (payload: { count: number }) => void;
  "notification": (payload: {
    type: string;
    title: string;
    message: string;
    meta?: string;
  }) => void;
};

export type SocketData = {
  userId: string;
  username: string;
  fullname: string;
  role: string;
};
