export interface User {
	id: string;
	roles: string[];
	identifiers?: { type: string; value: string }[];
	email?: string;
	name?: string;
	nama?: string;
	prefixTitle?: string;
	suffixTitle?: string;
}

export interface ProfileData {
	name?: string;
	nama?: string;
	prefixTitle?: string;
	suffixTitle?: string;
	studentId?: string;
	teacherId?: string;
	mentorId?: string;
	placementId?: string;
}

export interface Student {
	id: string;
	name: string;
	nama?: string;
	email: string;
	nisn: string;
	major: string;
	jurusan?: string;
	className?: string;
	grade?: string;
	kelas?: string;
}

export interface Teacher {
	id: string;
	userId?: string;
	name: string;
	nama?: string;
	email: string;
	nip?: string;
	prefixTitle?: string;
	suffixTitle?: string;
}

export interface IndustryMentor {
	id: string;
	userId?: string;
	name: string;
	nama?: string;
	email: string;
	phone: string;
	position: string;
	companyId: string;
	companyName?: string;
	prefixTitle?: string;
	suffixTitle?: string;
}

export interface Company {
	id: string;
	name: string;
	nama?: string;
	contactPerson: string;
	phone: string;
	address: string;
	operationalHourStart: string;
	operationalHourEnd: string;
	quota: number;
	kuota?: number;
	latitude: number;
	longitude: number;
}

export interface InternshipPlacement {
	id: string;
	studentId: string;
	companyId: string;
	teacherId: string;
	industryMentorId: string;
	mentorId?: string;
	startDate: string;
	endDate: string;
	durationDays: number;
	status: string;
	isAssessable: boolean;
	certificateUrl?: string;
	student?: Student;
	company?: Company;
	teacher?: Teacher;
	industryMentor?: IndustryMentor;
	mentor?: IndustryMentor;
	assessments?: Assessment[];
}

export interface LogbookReview {
	id: string;
	reviewerId: string;
	action: 'revision' | 'approved';
	content?: string;
	createdAt?: string;
}

export interface DailyLogbook {
	id: string;
	placementId: string;
	studentId: string;
	date: string;
	activityTitle: string;
	title?: string;
	description: string;
	teacherStatus: string;
	mentorStatus: string;
	teacherNotes?: string;
	teacherReview?: string;
	mentorFeedback?: string;
	mentorReview?: string;
	attachments?: Attachment[];
	placement?: InternshipPlacement;
	reviews?: LogbookReview[];
}

export interface Attendance {
	id: string;
	studentId: string;
	placementId: string;
	date: string;
	time: string;
	type: 'check_in' | 'check_out';
	status: 'accepted' | 'declined' | 'pending';
	description?: string;
	notes?: string;
	locationMetadata?: { latitude: number; longitude: number } | string;
	student?: Student;
	placement?: InternshipPlacement;
}

export interface Attachment {
	id: string;
	url?: string;
	filename?: string;
}

export interface Assessment {
	id: string;
	placementId: string;
	assessorType: 'teacher' | 'industry_mentor';
	assessorId: string;
	technicalScore?: number;
	nonTechnicalScore?: number;
	finalScore?: number;
	notes?: string;
	certificateAttachmentId?: string;
	attachment?: Attachment;
	attachmentId?: string;
}

export interface ApiResponse<T> {
	error?: boolean;
	message?: string;
	data?: T;
	pagination?: {
		currentPage: number;
		totalPage: number;
		totalData: number;
	};
}

export interface SelectOption {
	label: string;
	value: string | number;
}

export interface DashboardStats {
	totalStudents?: number;
	totalTeachers?: number;
	totalMentors?: number;
	totalCompanies?: number;
	totalPlacements?: number;
	activeStudents?: number;
	nonActiveStudents?: number;
	activeInternships?: number;
	checkInToday?: number;
	checkOutToday?: number;
	approvedLogbooks?: number;
	completedAssessments?: number;
	gradedInternships?: number;
	uploadedCertificates?: number;
}
