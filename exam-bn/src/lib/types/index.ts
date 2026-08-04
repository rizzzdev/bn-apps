export interface User {
	id: string;
	fullname: string;
	email: string | null;
	role: 'super_admin' | 'teacher' | 'student';
	pictureUrl?: string | null;
	className?: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}


export interface Exam {
	id: string;
	name: string;
	description?: string;
	questionCreatorId?: string;
	startTime: string;
	endTime: string;
	mcWeight?: number | null;
	essayWeight?: number | null;
	passingGrade?: number;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface Room {
	id: string;
	name: string;
	capacity?: number;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface RoomAvailability {
	roomId: string;
	capacity: number | null;
	occupied: number;
	remaining: number | null;
}

export interface ExamRoomClass {
	id: string;
	examRoomId: string;
	classId: string;
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string | null;
}

export interface ExamRoom {
	id: string;
	examId: string;
	roomId: string;
	status: 'PENDING' | 'ONGOING' | 'ENDED';
	exam?: Exam;
	room?: Room;
	examRoomClasses?: ExamRoomClass[];
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface EssayGrade {
	id: string;
	examRoomId: string;
	userId: string;
	questionId: string;
	points: number;
}

export interface ExamParticipant {
	id: string;
	examRoomId: string;
	userId: string;
	examRoom?: ExamRoom;
	user?: User;
}

export interface ExamSupervisor {
	id: string;
	examRoomId: string;
	userId: string;
	examRoom?: ExamRoom;
	user?: User;
}

export interface Option {
	id: string;
	questionId: string;
	text: string;
	deletedAt?: string | null;
}

export interface Question {
	id: string;
	text: string;
	type: 'MULTIPLE_CHOICE' | 'ESSAY';
	options?: Option[];
	correctAnswer?: { id: string; optionId: string };
}

export interface ExamQuestion {
	id: string;
	examRoomId: string;
	questionId: string;
	questionNumber: number;
	question?: Question;
}

export interface ExamAnswer {
	id: string;
	examRoomId: string;
	userId: string;
	questionId: string;
	optionId?: string | null;
	text?: string | null;
}

export interface ExamScore {
	id: string;
	examRoomId: string;
	userId: string;
	score: number | null;
	passed?: boolean | null;
}

export interface ParticipantStatus {
	id: string;
	fullname: string;
	online: boolean;
	locked: boolean;
}

export interface LogEntry {
	timestamp: string;
	message: string;
}

// API Response
export interface ApiResponse<T> {
	error: boolean;
	statusCode: number;
	message: string;
	data: T;
}
