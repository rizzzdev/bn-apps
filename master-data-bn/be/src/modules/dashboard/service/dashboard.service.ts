import { prisma } from '@/database';
import { withCache } from '@/utils/cache';

export class DashboardService {
  async getSummary() {
    return withCache('dashboard:summary', 300, async () => {
      const [totalStudents, totalTeachers, totalClasses, totalSubjects, totalMajors, activeSemester] = await Promise.all([
        prisma.student.count({ where: { deletedAt: null } }),
        prisma.teacher.count({ where: { deletedAt: null } }),
        prisma.class.count({ where: { deletedAt: null } }),
        prisma.subject.count({ where: { deletedAt: null } }),
        prisma.major.count({ where: { deletedAt: null } }),
        prisma.semester.findFirst({
          where: { status: 'Aktif', deletedAt: null },
          include: { academicYear: true }
        })
      ]);

      return {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalMajors,
        activeSemester: activeSemester ? activeSemester.type : 'Belum Diatur',
        activeAcademicYear: activeSemester?.academicYear ? activeSemester.academicYear.code : 'Belum Diatur'
      };
    });
  }
}

export const dashboardService = new DashboardService();
