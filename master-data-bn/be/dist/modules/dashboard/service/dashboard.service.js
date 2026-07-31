"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = exports.DashboardService = void 0;
const database_1 = require("../../../database");
const cache_1 = require("../../../utils/cache");
class DashboardService {
    async getSummary() {
        return (0, cache_1.withCache)('dashboard:summary', 300, async () => {
            const [totalStudents, totalTeachers, totalClasses, totalSubjects, totalMajors, activeSemester] = await Promise.all([
                database_1.prisma.student.count({ where: { deletedAt: null } }),
                database_1.prisma.teacher.count({ where: { deletedAt: null } }),
                database_1.prisma.class.count({ where: { deletedAt: null } }),
                database_1.prisma.subject.count({ where: { deletedAt: null } }),
                database_1.prisma.major.count({ where: { deletedAt: null } }),
                database_1.prisma.semester.findFirst({
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
exports.DashboardService = DashboardService;
exports.dashboardService = new DashboardService();
