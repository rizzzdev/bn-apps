import type { Socket } from 'socket.io-client';
import type { NotifType } from '$lib/stores/notifications';

export type AppSocket = Socket | null;

export interface NotificationPayload {
	type?: NotifType;
	title?: string;
	message?: string;
	meta?: string;
}

export interface ExamStartedPayload {
	examRoomId: string;
	startedAt: string;
}

export interface ExamEndedPayload {
	examRoomId: string;
	endedAt: string;
}

export interface ExamAnswerUpdatedPayload {
	userId: string;
	questionId: string;
	optionId?: string | null;
	text?: string | null;
}

export interface ExamViolationPayload {
	fullname?: string;
	email?: string;
	violationType: string;
	violationCount: number;
}

export interface ExamWarningPayload {
	fullname?: string;
	userId?: string;
}

export interface ExamErrorPayload {
	message: string;
}

export interface ChatMessagePayload {
	id: string;
	senderId: string;
	senderName: string;
	senderRole: string;
	receiverId: string;
	receiverName: string;
	receiverRole: string;
	message: string;
	timestamp: string;
	replyToId?: string | null;
	replyTo?: { id: string; senderName: string; message: string } | null;
}

export interface ChatHistoryPayload {
	otherUserId: string;
	messages: ChatMessagePayload[];
}
