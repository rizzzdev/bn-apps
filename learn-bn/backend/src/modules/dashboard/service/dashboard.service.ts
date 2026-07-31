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

    const totalPending = assignments.reduce((sum, a) => sum + a.ungradedCount, 0);

    return {
      totalPending,
      totalGraded,
      totalSubmissions,
      assignments,
    };
  }

  async getStudentPendingItems(studentId: string) {
    if (!studentId) {
      throw new SentriError('FORBIDDEN', 'Profil Murid tidak ditemukan', 403);
    }

    const classIds = await this.repository.findStudentClassIds(studentId);

    if (classIds.length === 0) {
      return {
        totalUnreadMaterials: 0,
        totalPendingAssignments: 0,
        totalPendingQuizzes: 0,
        pendingClassIds: 0,
        materials: [],
        assignments: [],
        quizzes: [],
      };
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
      totalSubmittedAssignments: submittedAssignments,
      totalAssignments,
      totalReadMaterials: readMaterials,
      totalMaterials,
      totalDoneQuizzes: doneQuizzes,
      totalQuizzes,
      totalUnreadMaterials: unreadCount,
      totalPendingAssignments: assignCount,
      totalPendingQuizzes: quizCount,
      pendingClassIds: classIds.length,
      materials: materials.map((m: any) => ({
        id: m.id,
        title: m.title,
        className:
          m.classes?.map((c: any) => c.class?.name).filter(Boolean).join(', ') || 'Kelas',
        createdAt: m.createdAt,
      })),
      assignments: assignments.map((a: any) => ({
        id: a.id,
        title: a.title,
        className:
          a.classes?.map((c: any) => c.class?.name).filter(Boolean).join(', ') || 'Kelas',
        deadline: a.deadline,
        teacherName: a.teacher?.fullname || '',
      })),
      quizzes: quizzes.map((q: any) => ({
        id: q.id,
        title: q.title,
        className:
          q.classes?.map((c: any) => c.class?.name).filter(Boolean).join(', ') || 'Kelas',
        questionCount: q._count?.questions ?? 0,
      })),
    };
  }
}

import { dashboardRepository } from '../repository/dashboard.repository';
export const dashboardService = new DashboardService(dashboardRepository);
