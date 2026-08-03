// ──────────────────────────────────────────────
// UI Display Types (existing)
// ──────────────────────────────────────────────
export interface Major {
	id: string;
	name: string;
	code: string;
	totalStudents: number;
	headOfDepartment: string;
	headOfDepartmentNip: string;
	status: string;
}

export interface Class {
	id: string;
	majorId: string;
	majorCode: string;
	name: string;
	totalStudents: number;
	homeroomTeacher: string;
	homeroomTeacherNip: string;
	academicYear: string;
	semester: number;
}

export interface Student {
	id: string;
	fullname: string;
	nis: string;
	nisn?: string;
	classId: string;
	className: string;
	majorId: string;
	majorName: string;
	academicYearId: string;
	status: string;
	photoUrl?: string;
}

export interface Teacher {
	id: string;
	fullname: string;
	nip: string;
	subject: string;
	field: string;
	class: string;
	academicYear: string;
	phone?: string;
	photoUrl?: string;
}

export interface Subject {
	id: string;
	name: string;
	code: string;
	totalTeachers: number;
	teacherId: string;
	teacherName: string;
	field: string;
}

export interface PicketSchedule {
	day: string;
	date: string;
	teachers: PicketTeacher[];
}

export interface PicketTeacher {
	id: string;
	fullname: string;
	location: string;
	photoUrl?: string;
	scheduleId?: string;
}

// ──────────────────────────────────────────────
// API Response Types (from OpenAPI)
// ──────────────────────────────────────────────
export interface ApiPagination {
	currentPage: number;
	totalPage: number;
	totalData: number;
	dataPerPage: number;
}

export interface ApiResponse<T> {
	error: boolean;
	statusCode: number;
	message: string;
	data: T | null;
	pagination?: ApiPagination;
}

// ──────────────────────────────────────────────
// Auth & Current User (logged-in session)
// ──────────────────────────────────────────────
export interface CurrentUser {
	id: string;
	identifier?: string;
	identifiers?: { id: string; type: string; value: string }[];
	roles: string[];
	[key: string]: unknown;
}

export interface TeacherProfile {
	id: string;
	fullname: string;
	prefixTitle?: string | null;
	suffixTitle?: string | null;
	nip?: string | null;
	userId?: string | null;
	pictureUrl?: string | null;
	status?: string;
	[key: string]: unknown;
}

// ──────────────────────────────────────────────
// Shadow Entities (read-only mirror)
// ──────────────────────────────────────────────
export interface ShadowAcademicYear {
	id: string;
	code: string;
	semesterType: 'Ganjil' | 'Genap';
	status: 'Aktif' | 'Tidak Aktif';
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	lastSyncAt: string | null;
}

export interface ShadowMajor {
	id: string;
	code: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	lastSyncAt: string | null;
}

export interface ShadowClass {
	id: string;
	name: string;
	majorId: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	lastSyncAt: string | null;
}

export interface ShadowTeacher {
	id: string;
	fullname: string;
	prefixTitle?: string | null;
	suffixTitle?: string | null;
	gender: 'L' | 'P' | null;
	nip: string | null;
	email: string | null;
	userId: string;
	pictureUrl: string | null;
	status: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	lastSyncAt: string | null;
}

export interface ShadowStudent {
	id: string;
	fullname: string;
	gender: 'L' | 'P' | null;
	nis: string | null;
	nisn: string | null;
	email: string | null;
	userId: string;
	pictureUrl: string | null;
	status: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	lastSyncAt: string | null;
}

export interface ShadowSubject {
	id: string;
	code: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	lastSyncAt: string | null;
}

// ──────────────────────────────────────────────
// Mapping Entities (local CRUD)
// ──────────────────────────────────────────────
export interface MajorStudent {
	id: string;
	majorId: string;
	studentId: string;
	academicYearId: string;
	status: 'Aktif' | 'Tidak Aktif' | 'Pindah' | 'Lulus';
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface ClassStudent {
	id: string;
	classId: string;
	studentId: string;
	academicYearId: string;
	status: 'Aktif' | 'Tidak Aktif' | 'Naik Kelas' | 'Tinggal Kelas' | 'Pindah' | 'Lulus';
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface HomeroomTeacher {
	id: string;
	teacherId: string;
	classId: string;
	academicYearId: string;
	status: 'Aktif' | 'Tidak Aktif';
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface SubjectTeacher {
	id: string;
	teacherId: string;
	subjectId: string;
	targetHours?: number;
	status: 'Aktif' | 'TidakAktif' | 'Lulus';
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface LessonHour {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateLessonHourRequest {
  name: string;
  startTime: string;
  endTime: string;
  order: number;
}

export interface UpdateLessonHourRequest {
  name?: string;
  startTime?: string;
  endTime?: string;
  order?: number;
}

export interface LessonSchedule {
  id: string;
  subjectId: string;
  lessonHourId: string;
  day: string;
  notes: string | null;
  status: 'Aktif' | 'Tidak Aktif';
  subject?: ShadowSubject;
  lessonHour?: LessonHour;
  teachers: { teacher: ShadowTeacher }[];
  classes: { class: ShadowClass }[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateLessonScheduleRequest {
  subjectId: string;
  lessonHourId: string;
  day: string;
  notes?: string | null;
  teacherIds: string[];
  classIds: string[];
}

export interface UpdateLessonScheduleRequest {
  subjectId?: string;
  lessonHourId?: string;
  day?: string;
  notes?: string;
  teacherIds?: string[];
  classIds?: string[];
}

export interface TeacherPicketSchedule {
	id: string;
	teacherId: string;
	day: string;
	status: 'Aktif' | 'Tidak Aktif';
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface MajorHead {
	id: string;
	teacherId: string;
	majorId: string;
	academicYearId: string;
	status: 'Aktif' | 'Tidak Aktif';
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

// ──────────────────────────────────────────────
// Request Types
// ──────────────────────────────────────────────
export interface CreateMajorStudentRequest {
	majorId: string;
	studentId: string;
	academicYearId: string;
	status: 'Aktif' | 'Tidak Aktif' | 'Pindah' | 'Lulus';
}

export interface UpdateMajorStudentRequest {
	majorId?: string;
	studentId?: string;
	academicYearId?: string;
	status?: 'Aktif' | 'Tidak Aktif' | 'Pindah' | 'Lulus';
}

export interface CreateClassStudentRequest {
	classId: string;
	studentId: string;
	academicYearId: string;
	status: 'Aktif' | 'Tidak Aktif' | 'Naik Kelas' | 'Tinggal Kelas' | 'Pindah' | 'Lulus';
}

export interface UpdateClassStudentRequest {
	classId?: string;
	studentId?: string;
	academicYearId?: string;
	status?: 'Aktif' | 'Tidak Aktif' | 'Naik Kelas' | 'Tinggal Kelas' | 'Pindah' | 'Lulus';
}

export interface CreateHomeroomTeacherRequest {
	teacherId: string;
	classId: string;
	academicYearId: string;
	status: 'Aktif' | 'Tidak Aktif';
}

export interface UpdateHomeroomTeacherRequest {
	teacherId?: string;
	classId?: string;
	academicYearId?: string;
	status?: 'Aktif' | 'Tidak Aktif';
}

export interface CreateSubjectTeacherRequest {
	teacherId: string;
	subjectId: string;
	targetHours?: number;
	status: 'Aktif' | 'Tidak Aktif' | 'Lulus';
}

export interface UpdateSubjectTeacherRequest {
	teacherId?: string;
	subjectId?: string;
	targetHours?: number;
	status?: 'Aktif' | 'Tidak Aktif' | 'Lulus';
}

export interface CreateTeacherPicketScheduleRequest {
	teacherId: string;
	day: string;
	status: 'Aktif' | 'Tidak Aktif';
}

export interface UpdateTeacherPicketScheduleRequest {
	teacherId?: string;
	day?: string;
	status?: 'Aktif' | 'Tidak Aktif';
}

export interface CreateMajorHeadRequest {
	teacherId: string;
	majorId: string;
	academicYearId: string;
	status: 'Aktif' | 'Tidak Aktif';
}

export interface UpdateMajorHeadRequest {
	teacherId?: string;
	majorId?: string;
	academicYearId?: string;
	status?: 'Aktif' | 'Tidak Aktif';
}

// ──────────────────────────────────────────────
// Bulk Operation Types
// ──────────────────────────────────────────────
export interface BulkIdsRequest {
	ids: string[];
}

export interface BulkStatusRequest {
	ids: string[];
	status: string;
}

export interface BulkCreateRequest {
	data: Record<string, unknown>[];
}

export interface PromoteHoldRequest {
	studentIds: string[];
	classId: string;
}

export interface TransferRequest {
	studentIds: string[];
	classId?: string;
}

export interface BulkStudentActionRequest {
	studentIds: string[];
}

export interface BulkActionResult {
	success: { studentId: string; message: string }[];
	failed: { studentId: string; message: string }[];
}

export interface DashboardStats {
	totalMajors: number;
	totalClasses: number;
	totalStudents: number;
	totalTeachers: number;
}

// ──────────────────────────────────────────────
// Timetable Generator Types
// ──────────────────────────────────────────────
export interface ClassSubjectRequirement {
	id?: string;
	classId: string;
	subjectId: string;
	teacherId?: string | null;
	weeklyHours: number;
	maxHoursPerDay: number;
	class?: ShadowClass;
	subject?: ShadowSubject;
	teacher?: ShadowTeacher;
}

export interface TeacherUnavailability {
	id?: string;
	teacherId: string;
	day: string;
	lessonHourId: string;
	reason?: string | null;
	teacher?: ShadowTeacher;
	lessonHour?: LessonHour;
}

export interface GeneratedSlot {
	day: string;
	lessonHourId: string;
	subjectId: string;
	subjectName: string;
	classId: string;
	className: string;
	teacherId: string;
	teacherName: string;
	classIds?: string[];
	classNames?: string[];
	teacherIds?: string[];
	teacherNames?: string[];
}

export interface UnassignedUnit {
	classIds: string[];
	classNames: string[];
	subjectId: string;
	subjectName: string;
	teacherIds: string[];
	teacherNames: string[];
	duration: number;
	reason: string;
}

export interface GeneratorPreviewResult {
	schedules: GeneratedSlot[];
	unassigned: UnassignedUnit[];
	qualityScore: number;
	stats: {
		totalUnits: number;
		assignedUnits: number;
		totalHours: number;
		assignedHours: number;
		attempts: number;
		durationMs: number;
	};
}

