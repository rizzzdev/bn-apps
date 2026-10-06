export interface ReportFilters {
	subjectId?: string;
	classId?: string;
	examId?: string;
	examRoomId?: string;
	teacherId?: string;
	from?: string;
	to?: string;
}

export interface ExamResultRow {
	examId: string;
	examName: string;
	subjectId: string | null;
	subjectName: string | null;
	examRoomId: string;
	roomName: string;
	classId: string | null;
	className: string | null;
	participantId: string;
	userId: string;
	fullname: string;
	email: string | null;
	teacherId: string | null;
	teacherName: string | null;
	score: number | null;
	passed: boolean | null;
	submitted: boolean;
	status: 'SUBMITTED' | 'PENDING_GRADE' | 'NOT_SUBMITTED';
	passingGrade: number;
	startTime: string;
	endTime: string;
}

export interface ExamResultsReport {
	items: ExamResultRow[];
	pagination: { page: number; limit: number; total: number };
}

export interface ExamStatisticsGroup {
	examId: string;
	examName: string;
	subjectId: string | null;
	subjectName: string | null;
	classId: string | null;
	className: string | null;
	totalParticipants: number;
	submitted: number;
	scored: number;
	pendingGrade: number;
	notSubmitted: number;
	passed: number;
	failed: number;
	failedTotal: number;
	average: number | null;
	minimum: number | null;
	maximum: number | null;
	avg: number | null;
	min: number | null;
	max: number | null;
	passRate: number | null;
	passingGrade: number;
	startTime: string;
	endTime: string;
	buckets: { label: string; count: number }[];
}

export interface ExamStatisticsReport {
	summary: {
		totalExams: number;
		totalRooms: number;
		totalParticipants: number;
		submitted: number;
		scored: number;
		pendingGrade: number;
		notSubmitted: number;
		passed: number;
		failed: number;
		failedTotal: number;
		average: number | null;
		minimum: number | null;
		maximum: number | null;
		passRate: number | null;
	};
	groups: ExamStatisticsGroup[];
}
