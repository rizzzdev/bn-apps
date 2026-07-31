import { api } from '$lib/api';

export interface ApiResponse<T> {
  error: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}

// ─── Types ───────────────────────────────────────────────

export interface TeacherClass {
  id: string;
  name: string;
  majorId: string;
  major?: { id: string; name: string };
  subjectName?: string;
  studentCount?: number;
}

export interface ClassStudent {
  id: string;
  classId: string;
  studentId: string;
  student: {
    id: string;
    fullname: string;
    nis: string | null;
    nisn: string | null;
    pictureUrl: string | null;
  };
}

export interface MaterialClassItem {
  id?: string;
  materialId?: string;
  classId: string;
  class?: { id: string; name: string };
}

export interface Material {
  id: string;
  title: string;
  content: string;
  status: 'Draft' | 'Published';
  classId?: string;
  teacherId: string;
  createdAt: string;
  attachments: { id: string; fileUrl: string; fileName: string }[];
  classes?: MaterialClassItem[];
  isRead?: boolean;
  readAt?: string;
  readStats?: {
    readCount: number;
    totalStudents: number;
  };
  reads?: {
    id: string;
    readAt: string;
    student: {
      id: string;
      fullname: string;
      nis: string | null;
      pictureUrl: string | null;
    };
  }[];
  readers?: {
    student: {
      id: string;
      fullname: string;
      nis: string | null;
      pictureUrl: string | null;
    };
    class: {
      id: string;
      name: string;
    };
    isRead: boolean;
    readAt: string | null;
  }[];
  teacher?: {
    id: string;
    fullname: string;
    prefixTitle?: string | null;
    suffixTitle?: string | null;
    pictureUrl: string | null;
    subjectTeachers?: {
      subject: { id: string; name: string; code: string };
    }[];
  };
}

export interface AssignmentClassItem {
  id?: string;
  assignmentId?: string;
  classId: string;
  class?: { id: string; name: string };
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'Draft' | 'Published';
  classId?: string;
  class?: { id: string; name: string };
  teacherId: string;
  createdAt: string;
  attachments: { id: string; fileUrl: string; fileName: string }[];
  classes?: AssignmentClassItem[];
  teacher?: {
    id: string;
    fullname: string;
    prefixTitle?: string | null;
    suffixTitle?: string | null;
    pictureUrl: string | null;
    subjectTeachers?: { subject: { id: string; name: string; code: string } }[];
  };
  submissionStats?: {
    submittedCount: number;
    totalStudents: number;
  };
  isSubmitted?: boolean;
  mySubmission?: { id: string; grade: number | null; createdAt: string } | null;
}

export interface AssignmentSubmission {
  id?: string;
  assignmentId?: string;
  studentId: string;
  fileUrl?: string | null;
  fileName?: string | null;
  content?: string | null;
  grade?: number | null;
  feedback?: string | null;
  createdAt?: string | null;
  class?: { id: string; name: string };
  student?: { id: string; fullname: string; nis: string | null; pictureUrl: string | null };
  submission?: any;
}

export interface QuizClassItem {
  id?: string;
  quizId?: string;
  classId: string;
  class?: { id: string; name: string };
}

export interface Quiz {
  id: string;
  title: string;
  timeLimit: number | null;
  status: 'Draft' | 'Published';
  classId?: string;
  classes?: QuizClassItem[];
  teacherId: string;
  createdAt?: string;
  questions?: QuizQuestion[];
  quizStats?: { completedCount: number; totalStudents: number };
  _count?: { questions: number };
  teacher?: {
    id: string;
    fullname: string;
    prefixTitle?: string | null;
    suffixTitle?: string | null;
    pictureUrl: string | null;
    subjectTeachers?: {
      subject: { id: string; name: string; code: string };
    }[];
  };
}

export interface QuizStudentSubmissionItem {
  student: {
    id: string;
    fullname: string;
    nis: string | null;
    pictureUrl: string | null;
  };
  class?: {
    id: string;
    name: string;
  };
  submission: {
    id: string;
    startedAt: string;
    finishedAt: string | null;
    score: number | null;
  } | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption?: number;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  startedAt: string;
  finishedAt: string | null;
  score: number | null;
  answers?: QuizSubmissionAnswer[];
}

export interface QuizSubmissionAnswer {
  id: string;
  quizQuestionId: string;
  selectedOption: number | null;
}

export interface LessonSchedule {
  id: string;
  day: string;
  notes: string | null;
  subject: { id: string; name: string; code: string };
  lessonHour: { id: string; name: string; startTime: string; endTime: string; order: number };
  teachers: { id: string; teacher: { id: string; fullname: string; prefixTitle?: string | null; suffixTitle?: string | null } }[];
  classes: { id: string; class: { id: string; name: string } }[];
}

export interface GradeData {
  classInfo: { id: string; name: string };
  assignments: { id: string; title: string }[];
  quizzes: { id: string; title: string }[];
  students: StudentGrades[];
}

export interface StudentGrades {
  student: { id: string; fullname: string; nis: string | null };
  assignments: { id: string; title: string; grade: number | null }[];
  quizzes: { id: string; title: string; score: number | null }[];
}

export interface MyGrades {
  assignments: { id: string; title: string; deadline: string; grade: number | null; status: string }[];
  quizzes: { id: string; title: string; score: number | null }[];
}

// ─── Dashboard Types ────────────────────────────────────

export interface TeacherPendingGradingItem {
  id: string;
  title: string;
  className: string;
  ungradedCount: number;
}

export interface TeacherPendingGrading {
  totalPending: number;
  totalGraded: number;
  totalSubmissions: number;
  assignments: TeacherPendingGradingItem[];
}

export interface StudentPendingMaterial {
  id: string;
  title: string;
  className: string;
  createdAt: string;
}

export interface StudentPendingAssignment {
  id: string;
  title: string;
  className: string;
  deadline: string;
  teacherName: string;
}

export interface StudentPendingQuiz {
  id: string;
  title: string;
  className: string;
  questionCount: number;
}

export interface StudentPendingItems {
  totalUnreadMaterials: number;
  totalPendingAssignments: number;
  totalPendingQuizzes: number;
  totalSubmittedAssignments: number;
  totalAssignments: number;
  totalReadMaterials: number;
  totalMaterials: number;
  totalDoneQuizzes: number;
  totalQuizzes: number;
  pendingClassIds: number;
  materials: StudentPendingMaterial[];
  assignments: StudentPendingAssignment[];
  quizzes: StudentPendingQuiz[];
}

// ─── Store ───────────────────────────────────────────────

class LmsStore {
  // ─── Teacher: Classes ────────────────────────────
  async getTeacherClasses(): Promise<TeacherClass[]> {
    const res = await api.get<ApiResponse<TeacherClass[]>>('/class/teacher');
    return res.data ?? [];
  }

  async getClassStudents(classId: string): Promise<ClassStudent[]> {
    const res = await api.get<ApiResponse<ClassStudent[]>>(`/class/${classId}/students`);
    return res.data ?? [];
  }

  // ─── Teacher/Student: Materials ──────────────────
  async getMaterialsByClass(classId: string): Promise<Material[]> {
    const res = await api.get<ApiResponse<Material[]>>(`/materials/class/${classId}`);
    return res.data ?? [];
  }

  async getMaterial(id: string): Promise<Material | null> {
    const res = await api.get<ApiResponse<Material>>(`/materials/${id}`);
    return res.data;
  }

  async createMaterial(data: {
    title: string;
    content: string;
    status?: 'Draft' | 'Published';
    classIds?: string[];
    classId?: string;
    attachments?: { fileUrl: string; fileName: string }[];
  }): Promise<Material> {
    const res = await api.post<ApiResponse<Material>>('/materials', data);
    return res.data!;
  }

  async updateMaterial(
    id: string,
    data: {
      title?: string;
      content?: string;
      status?: 'Draft' | 'Published';
      classIds?: string[];
      classId?: string;
      attachments?: { fileUrl: string; fileName: string }[];
    }
  ): Promise<Material> {
    const res = await api.put<ApiResponse<Material>>(`/materials/${id}`, data);
    return res.data!;
  }

  async markMaterialAsRead(id: string): Promise<{ id: string; materialId: string; studentId: string; readAt: string }> {
    const res = await api.post<ApiResponse<{ id: string; materialId: string; studentId: string; readAt: string }>>(`/materials/${id}/read`);
    return res.data!;
  }

  async deleteMaterial(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/materials/${id}`);
  }

  // ─── Teacher/Student: Assignments ────────────────
  async getMyAssignments(): Promise<Assignment[]> {
    const res = await api.get<ApiResponse<Assignment[]>>('/assignments');
    return res.data ?? [];
  }

  async getAssignmentsByClass(classId: string): Promise<Assignment[]> {
    const res = await api.get<ApiResponse<Assignment[]>>(`/assignments/class/${classId}`);
    return res.data ?? [];
  }

  async getAssignment(id: string): Promise<Assignment | null> {
    const res = await api.get<ApiResponse<Assignment>>(`/assignments/${id}`);
    return res.data;
  }

  async createAssignment(data: { title: string; description: string; deadline: string; classIds: string[]; status?: 'Draft' | 'Published'; attachments?: { fileUrl: string; fileName: string }[] }): Promise<Assignment> {
    const res = await api.post<ApiResponse<Assignment>>('/assignments', data);
    return res.data!;
  }

  async bulkCreateAssignment(data: { title: string; description: string; deadline: string; classIds: string[]; status?: 'Draft' | 'Published'; attachments?: { fileUrl: string; fileName: string }[] }): Promise<Assignment> {
    return this.createAssignment(data);
  }

  async updateAssignment(id: string, data: { title?: string; description?: string; deadline?: string; classIds?: string[]; status?: 'Draft' | 'Published'; attachments?: { fileUrl: string; fileName: string }[] }): Promise<Assignment> {
    const res = await api.put<ApiResponse<Assignment>>(`/assignments/${id}`, data);
    return res.data!;
  }

  async deleteAssignment(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/assignments/${id}`);
  }

  // ─── Student: Assignment Submissions ─────────────
  async getMySubmission(assignmentId: string): Promise<AssignmentSubmission | null> {
    const res = await api.get<ApiResponse<AssignmentSubmission>>(`/assignments/${assignmentId}/submissions/my`);
    return res.data;
  }

  async submitAssignment(assignmentId: string, data: { fileUrl?: string; fileName?: string; content?: string }): Promise<AssignmentSubmission> {
    const res = await api.post<ApiResponse<AssignmentSubmission>>(`/assignments/${assignmentId}/submissions`, data);
    return res.data!;
  }

  // ─── Teacher: Submissions ────────────────────────
  async getSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    const res = await api.get<ApiResponse<AssignmentSubmission[]>>(`/assignments/${assignmentId}/submissions`);
    return res.data ?? [];
  }

  async gradeSubmission(submissionId: string, data: { grade: number; feedback?: string }): Promise<AssignmentSubmission> {
    const res = await api.put<ApiResponse<AssignmentSubmission>>(`/assignment-submissions/${submissionId}/grade`, data);
    return res.data!;
  }

  async bulkGrade(grades: { submissionId: string; grade: number; feedback?: string }[]): Promise<AssignmentSubmission[]> {
    const res = await api.post<ApiResponse<AssignmentSubmission[]>>('/assignment-submissions/bulk-grade', { grades });
    return res.data ?? [];
  }

  // ─── Teacher/Student: Quizzes ────────────────────
  async getQuizzesByClass(classId: string): Promise<Quiz[]> {
    const res = await api.get<ApiResponse<Quiz[]>>(`/quizzes/class/${classId}`);
    return res.data ?? [];
  }

  async getQuiz(id: string): Promise<Quiz | null> {
    const res = await api.get<ApiResponse<Quiz>>(`/quizzes/${id}`);
    return res.data;
  }

  async createQuiz(data: {
    title: string;
    timeLimit?: number;
    status?: 'Draft' | 'Published';
    classId?: string;
    classIds?: string[];
    questions: { question: string; options: string[]; correctOption: number }[];
  }): Promise<Quiz> {
    const endpoint = data.classIds && data.classIds.length > 1 ? '/quizzes/bulk' : '/quizzes';
    const res = await api.post<ApiResponse<Quiz | Quiz[]>>(endpoint, data);
    return Array.isArray(res.data) ? res.data[0] : res.data!;
  }

  async updateQuiz(
    id: string,
    data: {
      title?: string;
      timeLimit?: number;
      status?: 'Draft' | 'Published';
      classId?: string;
      classIds?: string[];
      questions?: { question: string; options: string[]; correctOption: number }[];
    }
  ): Promise<Quiz> {
    const res = await api.put<ApiResponse<Quiz>>(`/quizzes/${id}`, data);
    return res.data!;
  }

  async deleteQuiz(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/quizzes/${id}`);
  }

  async getQuizSubmissions(quizId: string): Promise<QuizStudentSubmissionItem[]> {
    const res = await api.get<ApiResponse<QuizStudentSubmissionItem[]>>(`/quizzes/${quizId}/submissions`);
    return res.data ?? [];
  }

  // ─── Student: Quiz Submissions ───────────────────
  async startQuiz(quizId: string): Promise<QuizSubmission> {
    const res = await api.post<ApiResponse<QuizSubmission>>(`/quizzes/${quizId}/submissions/start`);
    return res.data!;
  }

  async finishQuiz(quizId: string, answers: { quizQuestionId: string; selectedOption: number }[]): Promise<QuizSubmission> {
    const res = await api.post<ApiResponse<QuizSubmission>>(`/quizzes/${quizId}/submissions/finish`, { answers });
    return res.data!;
  }

  async getMyQuizSubmission(quizId: string): Promise<QuizSubmission | null> {
    const res = await api.get<ApiResponse<QuizSubmission>>(`/quizzes/${quizId}/submissions/my`);
    return res.data;
  }

  // ─── Teacher/Student: Grades ─────────────────────
  async getMyGrades(classId: string): Promise<MyGrades | null> {
    const res = await api.get<ApiResponse<MyGrades>>(`/grades/class/${classId}/my`);
    return res.data;
  }

  async getClassGrades(classId: string): Promise<GradeData | null> {
    const res = await api.get<ApiResponse<GradeData>>(`/grades/class/${classId}`);
    return res.data;
  }

  // ─── Schedule ────────────────────────────────────
  async getSchedule(teacherId?: string): Promise<LessonSchedule[]> {
    const params = new URLSearchParams({ limit: '100' });
    if (teacherId) params.set('teacherId', teacherId);
    const res = await api.get<ApiResponse<LessonSchedule[]>>(`/lesson-schedule?${params.toString()}`);
    return res.data ?? [];
  }

  async getStudentSchedule(studentId?: string | null): Promise<LessonSchedule[]> {
    const endpoint = (studentId && studentId !== 'undefined') ? `/lesson-schedule/student/${studentId}` : '/lesson-schedule/student/my';
    const res = await api.get<ApiResponse<LessonSchedule[]>>(endpoint);
    return res.data ?? [];
  }

  // ─── Dashboard: Teacher Pending Grading ──────────
  async getTeacherPendingGrading(): Promise<TeacherPendingGrading | null> {
    const res = await api.get<ApiResponse<TeacherPendingGrading>>('/dashboard/teacher/pending-grading');
    return res.data;
  }

  // ─── Dashboard: Student Pending Items ──────────
  async getStudentPendingItems(): Promise<StudentPendingItems | null> {
    const res = await api.get<ApiResponse<StudentPendingItems>>('/dashboard/student/pending-items');
    return res.data;
  }

  // ─── Student: Classes (from enrollment) ──────────
  async getStudentClasses(studentId?: string): Promise<TeacherClass[]> {
    const res = await api.get<ApiResponse<TeacherClass[]>>('/class/student');
    return res.data ?? [];
  }
}

export const lmsStore = new LmsStore();

