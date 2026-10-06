import { DashboardRepository } from '../repository/dashboard.repository';
import { SentriError } from 'sentri/core';

export class DashboardService {
  constructor(private repository: DashboardRepository) {}

  async getTeacherPendingGrading(teacherId: string) {
    if (!teacherId) {
      throw new SentriError('FORBIDDEN', 'Profil Guru tidak ditemukan', 403);
    }

    const [assignments, totalGraded, totalSubmissions] = await Promise.all([
      this.repository.findTeacherPendingGrading(teacherId),
      this.repository.countTeacherGradedSubmissions(teacherId),
      this.repository.countTeacherTotalSubmissions(teacherId),
    ]);

    const totalPending = assignments.reduce((sum, assignment) => sum + assignment.ungradedCount, 0);

    return { totalPending, totalGraded, totalSubmissions, assignments };
  }

  async getStudentPendingItems(studentId: string) {
    if (!studentId) {
      throw new SentriError('FORBIDDEN', 'Profil Murid tidak ditemukan', 403);
    }

    const classIds = await this.repository.findStudentClassIds(studentId);
    if (classIds.length === 0) {
      return { totalUnreadMaterials: 0, totalPendingAssignments: 0, totalPendingQuizzes: 0, pendingClassIds: 0, materials: [], assignments: [], quizzes: [] };
    }

    const [materials, assignments, quizzes, unreadCount, assignCount, quizCount,
      submittedAssignments, totalAssignments, readMaterials, totalMaterials,
      doneQuizzes, totalQuizzes] =
      await Promise.all([
        this.repository.findStudentPendingMaterials(studentId, classIds),
        this.repository.findStudentPendingAssignments(studentId, classIds),
        this.repository.findStudentPendingQuizzes(studentId, classIds),
        this.repository.countTotalUnreadMaterials(studentId, classIds),
        this.repository.countTotalPendingAssignments(studentId, classIds),
        this.repository.countTotalPendingQuizzes(studentId, classIds),
        this.repository.countStudentAssignmentsSubmitted(studentId, classIds),
        this.repository.countStudentTotalAssignments(studentId, classIds),
        this.repository.countStudentMaterialsRead(studentId, classIds),
        this.repository.countStudentTotalMaterials(studentId, classIds),
        this.repository.countStudentQuizzesDone(studentId, classIds),
        this.repository.countStudentTotalQuizzes(studentId, classIds),
      ]);

    return {
      totalSubmittedAssignments: submittedAssignments, totalAssignments, totalReadMaterials: readMaterials,
      totalMaterials, totalDoneQuizzes: doneQuizzes, totalQuizzes,
      totalUnreadMaterials: unreadCount, totalPendingAssignments: assignCount, totalPendingQuizzes: quizCount,
      pendingClassIds: classIds.length,
      materials: materials.map((material) => ({ id: material.id, title: material.title, className: material.classes?.map((classRef) => classRef.class?.name).filter(Boolean).join(', ') || 'Kelas', createdAt: material.createdAt })),
      assignments: assignments.map((assignment) => ({ id: assignment.id, title: assignment.title, className: assignment.classes?.map((classRef) => classRef.class?.name).filter(Boolean).join(', ') || 'Kelas', deadline: assignment.deadline, teacherName: assignment.teacher?.fullname || '' })),
      quizzes: quizzes.map((quiz) => ({ id: quiz.id, title: quiz.title, className: quiz.classes?.map((classRef) => classRef.class?.name).filter(Boolean).join(', ') || 'Kelas', questionCount: quiz._count?.questions ?? 0 })),
    };
  }

  // ─── Curriculum (Waka Kurikulum) ──────────────────────────────────────

  async getCurriculumOverview() {
    return this.repository.findCurriculumOverview();
  }

  async getCurriculumTeachers(page: number, limit: number, search?: string) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return this.repository.findCurriculumTeachers(safePage, safeLimit, search);
  }

  async getCurriculumStudentsAtRisk(page: number, limit: number, threshold: number, classId?: string) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const safeThreshold = Math.min(100, Math.max(0, threshold));
    return this.repository.findCurriculumStudentsAtRisk(safePage, safeLimit, safeThreshold, classId);
  }

  async getCurriculumClasses(page: number, limit: number) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return this.repository.findCurriculumClasses(safePage, safeLimit);
  }
}

import { dashboardRepository } from '../repository/dashboard.repository';
export const dashboardService = new DashboardService(dashboardRepository);
