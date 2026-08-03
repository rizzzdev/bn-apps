import { api } from '$lib/api';
import { authState } from '$lib/features/auth/auth.svelte';

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
      nisn?: string | null;
      pictureUrl: string | null;
    };
  }[];
  readers?: {
    student: {
      id: string;
      fullname: string;
      nis: string | null;
      nisn?: string | null;
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
  student?: { id: string; fullname: string; nis: string | null; nisn?: string | null; pictureUrl: string | null };
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
    nisn?: string | null;
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
  student: { id: string; fullname: string; nis: string | null; nisn?: string | null; pictureUrl?: string | null };
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
  private teacherIdCache: string | null = null;
  private studentIdCache: string | null = null;

  async getTeacherId(): Promise<string | null> {
    if (this.teacherIdCache) return this.teacherIdCache;

    const profileId = authState.user?.profileId;
    if (profileId) {
      this.teacherIdCache = profileId;
      return this.teacherIdCache;
    }

    const userId = authState.user?.id;
    if (!userId) return null;

    try {
      const res = await api.get<ApiResponse<any[]> | any[]>(`/master/teachers?userId=${userId}&limit=1`);
      const items = Array.isArray(res) ? res : (res.data ?? []);
      if (items.length > 0 && items[0].id) {
        this.teacherIdCache = items[0].id;
        return this.teacherIdCache;
      }
    } catch {
      // ignore error
    }

    return null;
  }

  async getStudentId(): Promise<string | null> {
    if (this.studentIdCache) return this.studentIdCache;

    const profileId = authState.user?.profileId;
    if (profileId) {
      this.studentIdCache = profileId;
      return this.studentIdCache;
    }

    const userId = authState.user?.id;
    if (!userId) return null;

    try {
      const res = await api.get<ApiResponse<any[]> | any[]>(`/master/students?userId=${userId}&includeCurrentClass=true&limit=1`);
      const items = Array.isArray(res) ? res : (res.data ?? []);
      if (items.length > 0 && items[0].id) {
        this.studentIdCache = items[0].id;
        return this.studentIdCache;
      }
    } catch {
      // ignore error
    }

    return null;
  }

  // ─── Teacher: Classes (Filtered for Logged-In Teacher) ─
  async getTeacherClasses(): Promise<TeacherClass[]> {
    const [res, classStudentsRes, masterStudentsRes] = await Promise.all([
      api.get<ApiResponse<TeacherClass[]> | TeacherClass[]>('/master/classes?limit=100&includeMajor=true'),
      api.get<ApiResponse<any[]> | any[]>('/academic/class-students?limit=100').catch(() => []),
      api.get<ApiResponse<any[]> | any[]>('/master/students?includeCurrentClass=true&limit=100').catch(() => [])
    ]);

    const allClassesRaw = Array.isArray(res) ? res : (res.data ?? []);
    const classStudents = Array.isArray(classStudentsRes) ? classStudentsRes : ((classStudentsRes as any)?.data ?? []);
    const masterStudents = Array.isArray(masterStudentsRes) ? masterStudentsRes : ((masterStudentsRes as any)?.data ?? []);

    const countMap = new Map<string, Set<string>>();
    for (const cs of classStudents) {
      if (cs.classId && (cs.status === 'Aktif' || !cs.status)) {
        if (!countMap.has(cs.classId)) countMap.set(cs.classId, new Set());
        countMap.get(cs.classId)!.add(cs.studentId);
      }
    }
    for (const st of masterStudents) {
      const cId = st.currentClass?.id || st.currentClassId;
      if (cId) {
        if (!countMap.has(cId)) countMap.set(cId, new Set());
        countMap.get(cId)!.add(st.id);
      }
    }

    const allClasses = allClassesRaw.map((cls) => ({
      ...cls,
      studentCount: countMap.get(cls.id)?.size ?? 0
    }));

    if (authState.user?.role && authState.user.role !== 'teacher') {
      return allClasses;
    }

    const teacherId = await this.getTeacherId();
    if (!teacherId) {
      return allClasses;
    }

    try {
      const [scheduleRes, subjectTeachersRes] = await Promise.all([
        api.get<ApiResponse<LessonSchedule[]> | LessonSchedule[]>(`/academic/lesson-schedules?limit=100&teacherId=${teacherId}`).catch(() => []),
        api.get<ApiResponse<any[]> | any[]>(`/academic/subject-teachers?teacherId=${teacherId}&limit=100`).catch(() => [])
      ]);

      const schedules = Array.isArray(scheduleRes) ? scheduleRes : ((scheduleRes as any)?.data ?? []);
      const subjectTeachers = Array.isArray(subjectTeachersRes) ? subjectTeachersRes : ((subjectTeachersRes as any)?.data ?? []);

      const taughtClassIds = new Set<string>();

      for (const item of schedules) {
        if (item.classes?.length) {
          for (const c of item.classes) {
            if (c.class?.id) taughtClassIds.add(c.class.id);
            else if ((c as any).classId) taughtClassIds.add((c as any).classId);
          }
        }
      }

      for (const st of subjectTeachers) {
        if (st.classId) taughtClassIds.add(st.classId);
        if (st.class?.id) taughtClassIds.add(st.class.id);
      }

      if (taughtClassIds.size > 0) {
        return allClasses.filter((cls) => taughtClassIds.has(cls.id));
      }
    } catch {
      // Fallback
    }

    return allClasses;
  }

  // ─── Class Members (Students in Class) ────────────────
  async getClassStudents(classId: string): Promise<ClassStudent[]> {
    try {
      const [classStudentsRes, masterStudentsRes] = await Promise.all([
        api.get<ApiResponse<any[]> | any[]>(`/academic/class-students?limit=100`).catch(() => []),
        api.get<ApiResponse<any[]> | any[]>(`/master/students?includeCurrentClass=true&includePicture=true&limit=100`).catch(() => [])
      ]);

      const classStudents = Array.isArray(classStudentsRes) ? classStudentsRes : ((classStudentsRes as any)?.data ?? []);
      const masterStudents = Array.isArray(masterStudentsRes) ? masterStudentsRes : ((masterStudentsRes as any)?.data ?? []);

      const studentMap = new Map<string, any>();
      for (const st of masterStudents) {
        if (!studentMap.has(st.id)) studentMap.set(st.id, st);
      }

      const classMemberStudentIds = new Set<string>();

      for (const cs of classStudents) {
        if (cs.classId === classId && (cs.status === 'Aktif' || !cs.status)) {
          classMemberStudentIds.add(cs.studentId);
        }
      }

      for (const st of masterStudents) {
        const cId = st.currentClass?.id || st.currentClassId;
        if (cId === classId) {
          classMemberStudentIds.add(st.id);
        }
      }

      const members: ClassStudent[] = [];
      for (const studentId of classMemberStudentIds) {
        const st = studentMap.get(studentId);
        const cs = classStudents.find((c: any) => c.studentId === studentId && c.classId === classId);
        members.push({
          id: cs?.id || studentId,
          classId: classId,
          studentId: studentId,
          student: {
            id: studentId,
            fullname: st?.fullname || 'Siswa',
            nis: st?.nis || null,
            nisn: st?.nisn || null,
            pictureUrl: st?.pictureUrl || null,
          }
        });
      }

      return members;
    } catch (err) {
      console.error('[lmsStore] getClassStudents error:', err);
      return [];
    }
  }

  // ─── Teacher/Student: Materials (Learn API) ───────
  async getMaterialsByClass(classId: string): Promise<Material[]> {
    const res = await api.get<ApiResponse<Material[]>>(`/learn/materials/class/${classId}`);
    return res.data ?? [];
  }

  async getMaterial(id: string): Promise<Material | null> {
    const res = await api.get<ApiResponse<Material>>(`/learn/materials/${id}`);
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
    const res = await api.post<ApiResponse<Material>>('/learn/materials', data);
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
    const res = await api.put<ApiResponse<Material>>(`/learn/materials/${id}`, data);
    return res.data!;
  }

  async markMaterialAsRead(id: string): Promise<{ id: string; materialId: string; studentId: string; readAt: string }> {
    const res = await api.post<ApiResponse<{ id: string; materialId: string; studentId: string; readAt: string }>>(`/learn/materials/${id}/read`);
    return res.data!;
  }

  async deleteMaterial(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/learn/materials/${id}`);
  }

  // ─── Teacher/Student: Assignments (Learn API) ─────
  async getMyAssignments(): Promise<Assignment[]> {
    const res = await api.get<ApiResponse<Assignment[]>>('/learn/assignments');
    return res.data ?? [];
  }

  async getAssignmentsByClass(classId: string): Promise<Assignment[]> {
    const res = await api.get<ApiResponse<Assignment[]>>(`/learn/assignments/class/${classId}`);
    return res.data ?? [];
  }

  async getAssignment(id: string): Promise<Assignment | null> {
    const res = await api.get<ApiResponse<Assignment>>(`/learn/assignments/${id}`);
    return res.data;
  }

  async createAssignment(data: { title: string; description: string; deadline: string; classIds: string[]; status?: 'Draft' | 'Published'; attachments?: { fileUrl: string; fileName: string }[] }): Promise<Assignment> {
    const res = await api.post<ApiResponse<Assignment>>('/learn/assignments', data);
    return res.data!;
  }

  async bulkCreateAssignment(data: { title: string; description: string; deadline: string; classIds: string[]; status?: 'Draft' | 'Published'; attachments?: { fileUrl: string; fileName: string }[] }): Promise<Assignment> {
    return this.createAssignment(data);
  }

  async updateAssignment(id: string, data: { title?: string; description?: string; deadline?: string; classIds?: string[]; status?: 'Draft' | 'Published'; attachments?: { fileUrl: string; fileName: string }[] }): Promise<Assignment> {
    const res = await api.put<ApiResponse<Assignment>>(`/learn/assignments/${id}`, data);
    return res.data!;
  }

  async deleteAssignment(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/learn/assignments/${id}`);
  }

  // ─── Student: Assignment Submissions (Learn API) ──
  async getMySubmission(assignmentId: string): Promise<AssignmentSubmission | null> {
    const res = await api.get<ApiResponse<AssignmentSubmission>>(`/learn/assignments/${assignmentId}/submissions/my`);
    return res.data;
  }

  async submitAssignment(assignmentId: string, data: { fileUrl?: string; fileName?: string; content?: string }): Promise<AssignmentSubmission> {
    const res = await api.post<ApiResponse<AssignmentSubmission>>(`/learn/assignments/${assignmentId}/submissions`, data);
    return res.data!;
  }

  // ─── Teacher: Submissions (Learn API) ─────────────
  async getSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    const res = await api.get<ApiResponse<AssignmentSubmission[]>>(`/learn/assignments/${assignmentId}/submissions`);
    return res.data ?? [];
  }

  async gradeSubmission(submissionId: string, data: { grade: number; feedback?: string }): Promise<AssignmentSubmission> {
    const res = await api.put<ApiResponse<AssignmentSubmission>>(`/learn/assignment-submissions/${submissionId}/grade`, data);
    return res.data!;
  }

  async bulkGrade(grades: { submissionId: string; grade: number; feedback?: string }[]): Promise<AssignmentSubmission[]> {
    const res = await api.post<ApiResponse<AssignmentSubmission[]>>('/learn/assignment-submissions/bulk-grade', { grades });
    return res.data ?? [];
  }

  // ─── Teacher/Student: Quizzes (Learn API) ─────────
  async getQuizzesByClass(classId: string): Promise<Quiz[]> {
    const res = await api.get<ApiResponse<Quiz[]>>(`/learn/quizzes/class/${classId}`);
    return res.data ?? [];
  }

  async getQuiz(id: string): Promise<Quiz | null> {
    const res = await api.get<ApiResponse<Quiz>>(`/learn/quizzes/${id}`);
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
    const endpoint = data.classIds && data.classIds.length > 1 ? '/learn/quizzes/batch' : '/learn/quizzes';
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
    const res = await api.put<ApiResponse<Quiz>>(`/learn/quizzes/${id}`, data);
    return res.data!;
  }

  async deleteQuiz(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/learn/quizzes/${id}`);
  }

  async getQuizSubmissions(quizId: string): Promise<QuizStudentSubmissionItem[]> {
    const res = await api.get<ApiResponse<QuizStudentSubmissionItem[]>>(`/learn/quizzes/${quizId}/submissions`);
    return res.data ?? [];
  }

  // ─── Student: Quiz Submissions (Learn API) ────────
  async startQuiz(quizId: string): Promise<QuizSubmission> {
    const res = await api.post<ApiResponse<QuizSubmission>>(`/learn/quizzes/${quizId}/submissions/start`);
    return res.data!;
  }

  async finishQuiz(quizId: string, answers: { quizQuestionId: string; selectedOption: number }[]): Promise<QuizSubmission> {
    const res = await api.post<ApiResponse<QuizSubmission>>(`/learn/quizzes/${quizId}/submissions/finish`, { answers });
    return res.data!;
  }

  async getMyQuizSubmission(quizId: string): Promise<QuizSubmission | null> {
    const res = await api.get<ApiResponse<QuizSubmission>>(`/learn/quizzes/${quizId}/submissions/my`);
    return res.data;
  }

  // ─── Teacher/Student: Grades (Learn API) ──────────
  async getMyGrades(classId: string): Promise<MyGrades | null> {
    const res = await api.get<ApiResponse<MyGrades>>(`/learn/grades/class/${classId}/my`);
    return res.data;
  }

  async getClassGrades(classId: string): Promise<GradeData | null> {
    const res = await api.get<ApiResponse<GradeData>>(`/learn/grades/class/${classId}`);
    return res.data;
  }

  // ─── Schedule (Academic API) ──────────────────────
  async getSchedule(teacherId?: string): Promise<LessonSchedule[]> {
    const tId = teacherId || (await this.getTeacherId());
    const params = new URLSearchParams({ limit: '100' });
    if (tId) params.set('teacherId', tId);
    const res = await api.get<ApiResponse<LessonSchedule[]> | LessonSchedule[]>(`/academic/lesson-schedules?${params.toString()}`);
    if (Array.isArray(res)) return res;
    return res.data ?? [];
  }

  async getStudentSchedule(studentId?: string | null): Promise<LessonSchedule[]> {
    const res = await api.get<ApiResponse<LessonSchedule[]> | LessonSchedule[]>('/academic/lesson-schedules');
    if (Array.isArray(res)) return res;
    return res.data ?? [];
  }

  // ─── Dashboard: Teacher Pending Grading (Learn API)
  async getTeacherPendingGrading(): Promise<TeacherPendingGrading | null> {
    const res = await api.get<ApiResponse<TeacherPendingGrading>>('/learn/dashboard/teacher/pending-grading');
    return res.data;
  }

  // ─── Dashboard: Student Pending Items (Learn API) ─
  async getStudentPendingItems(): Promise<StudentPendingItems | null> {
    const res = await api.get<ApiResponse<StudentPendingItems>>('/learn/dashboard/student/pending-items');
    return res.data;
  }

  // ─── Student: Classes (Filtered for Logged-In Student)
  async getStudentClasses(studentId?: string): Promise<TeacherClass[]> {
    const [res, classStudentsRes, masterStudentsRes] = await Promise.all([
      api.get<ApiResponse<TeacherClass[]> | TeacherClass[]>('/master/classes?limit=100&includeMajor=true'),
      api.get<ApiResponse<any[]> | any[]>('/academic/class-students?limit=100').catch(() => []),
      api.get<ApiResponse<any[]> | any[]>('/master/students?includeCurrentClass=true&limit=100').catch(() => [])
    ]);

    const allClassesRaw = Array.isArray(res) ? res : (res.data ?? []);
    const classStudents = Array.isArray(classStudentsRes) ? classStudentsRes : ((classStudentsRes as any)?.data ?? []);
    const masterStudents = Array.isArray(masterStudentsRes) ? masterStudentsRes : ((masterStudentsRes as any)?.data ?? []);

    const countMap = new Map<string, Set<string>>();
    for (const cs of classStudents) {
      if (cs.classId && (cs.status === 'Aktif' || !cs.status)) {
        if (!countMap.has(cs.classId)) countMap.set(cs.classId, new Set());
        countMap.get(cs.classId)!.add(cs.studentId);
      }
    }
    for (const st of masterStudents) {
      const cId = st.currentClass?.id || st.currentClassId;
      if (cId) {
        if (!countMap.has(cId)) countMap.set(cId, new Set());
        countMap.get(cId)!.add(st.id);
      }
    }

    const allClasses = allClassesRaw.map((cls) => ({
      ...cls,
      studentCount: countMap.get(cls.id)?.size ?? 0
    }));

    const targetStudentId = studentId || (await this.getStudentId());
    if (!targetStudentId) {
      return allClasses;
    }

    try {
      const studentDetailRes = await api.get<ApiResponse<any> | any>(`/master/students/${targetStudentId}?includeCurrentClass=true`).catch(() => null);
      const studentDetail = (studentDetailRes as any)?.data || studentDetailRes;

      const enrolledClassIds = new Set<string>();

      for (const cs of classStudents) {
        if (cs.studentId === targetStudentId && (cs.status === 'Aktif' || !cs.status)) {
          if (cs.classId) enrolledClassIds.add(cs.classId);
          if (cs.class?.id) enrolledClassIds.add(cs.class.id);
        }
      }

      if (studentDetail?.currentClass?.id) {
        enrolledClassIds.add(studentDetail.currentClass.id);
      } else if (studentDetail?.currentClassId) {
        enrolledClassIds.add(studentDetail.currentClassId);
      }

      if (enrolledClassIds.size > 0) {
        return allClasses.filter((cls) => enrolledClassIds.has(cls.id));
      }
    } catch {
      // Fallback
    }

    return allClasses;
  }
}

export const lmsStore = new LmsStore();
