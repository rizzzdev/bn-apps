import { prisma } from '@internship/database/index.js';
import { getOrchestrator } from '@app/orchestrator.js';

export class DashboardService {
  async getAdminStats() {
    try {
      const orchestrator = getOrchestrator();
      const [masterStudents, masterTeachers] = await Promise.all([
        orchestrator.masterStudent.findAll(),
        orchestrator.masterTeacher.findAll(),
      ]);

      for (const ms of masterStudents) {
        if (!ms.email) continue;
        await prisma.student.upsert({
          where: { id: ms.id },
          update: { name: ms.fullname, email: ms.email, nisn: ms.nisn ?? undefined, userId: ms.userId },
          create: { id: ms.id, name: ms.fullname, email: ms.email, nisn: ms.nisn ?? undefined, userId: ms.userId },
        }).catch(() => {});
      }

      for (const mt of masterTeachers) {
        if (!mt.email) continue;
        await prisma.teacher.upsert({
          where: { id: mt.id },
          update: { name: mt.fullname, email: mt.email, nip: mt.nip ?? undefined, prefixTitle: mt.prefixTitle ?? undefined, suffixTitle: mt.suffixTitle ?? undefined, userId: mt.userId },
          create: { id: mt.id, name: mt.fullname, email: mt.email, nip: mt.nip ?? undefined, prefixTitle: mt.prefixTitle ?? undefined, suffixTitle: mt.suffixTitle ?? undefined, userId: mt.userId },
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to sync master stats:', e);
    }

    const [totalStudents, totalTeachers, totalMentors, totalCompanies, totalPlacements, activePlacements] = await Promise.all([
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.teacher.count({ where: { deletedAt: null } }),
      prisma.industryMentor.count({ where: { deletedAt: null } }),
      prisma.company.count({ where: { deletedAt: null } }),
      prisma.internshipPlacement.count({ where: { deletedAt: null } }),
      prisma.internshipPlacement.count({ where: { deletedAt: null, status: 'active' } })
    ]);
    const activeStudents = activePlacements;
    const nonActiveStudents = Math.max(0, totalStudents - activeStudents);
    return { totalStudents, totalTeachers, totalMentors, totalCompanies, totalPlacements, activeStudents, nonActiveStudents };
  }

  async getProfileNameByEmail(email: string) {
    const orchestrator = getOrchestrator();

    const [student, teacher, mentor] = await Promise.all([
      prisma.student.findFirst({ where: { email, deletedAt: null } }),
      prisma.teacher.findFirst({ where: { email, deletedAt: null } }),
      prisma.industryMentor.findFirst({ where: { email, deletedAt: null } })
    ]);

    if (student) {
      const placement = await prisma.internshipPlacement.findFirst({ where: { studentId: student.id, status: 'active' } });
      return { name: student.name, role: 'student', studentId: student.id, placementId: placement?.id };
    }
    if (teacher) {
      const prefix = teacher.prefixTitle ? teacher.prefixTitle + ' ' : '';
      const suffix = teacher.suffixTitle ? ', ' + teacher.suffixTitle : '';
      return { name: prefix + teacher.name + suffix, role: 'teacher', teacherId: teacher.id };
    }
    if (mentor) {
      const prefix = mentor.prefixTitle ? mentor.prefixTitle + ' ' : '';
      const suffix = mentor.suffixTitle ? ', ' + mentor.suffixTitle : '';
      return { name: prefix + mentor.name + suffix, role: 'mentor', mentorId: mentor.id };
    }

    const [masterTeacher, masterStudent] = await Promise.all([
      orchestrator.masterTeacher.findByEmail(email),
      orchestrator.masterStudent.findByEmail(email)
    ]);

    if (masterTeacher) {
      const prefix = masterTeacher.prefixTitle ? masterTeacher.prefixTitle + ' ' : '';
      const suffix = masterTeacher.suffixTitle ? ', ' + masterTeacher.suffixTitle : '';
      return { name: prefix + masterTeacher.fullname + suffix, role: 'teacher', teacherId: null };
    }
    if (masterStudent) {
      return { name: masterStudent.fullname, role: 'student', studentId: null };
    }

    return { name: 'Super Admin', role: 'admin' };
  }

  async getProfileNameById(sentriUserId: string) {
    const orchestrator = getOrchestrator();

    const [student, teacher, mentor] = await Promise.all([
      prisma.student.findFirst({ where: { userId: sentriUserId, deletedAt: null } }),
      prisma.teacher.findFirst({ where: { userId: sentriUserId, deletedAt: null } }),
      prisma.industryMentor.findFirst({ where: { userId: sentriUserId, deletedAt: null } })
    ]);

    if (student) {
      const placement = await prisma.internshipPlacement.findFirst({ where: { studentId: student.id, status: 'active' } });
      return { name: student.name, role: 'student', studentId: student.id, placementId: placement?.id };
    }
    if (teacher) {
      const prefix = teacher.prefixTitle ? teacher.prefixTitle + ' ' : '';
      const suffix = teacher.suffixTitle ? ', ' + teacher.suffixTitle : '';
      return { name: prefix + teacher.name + suffix, role: 'teacher', teacherId: teacher.id };
    }
    if (mentor) {
      const prefix = mentor.prefixTitle ? mentor.prefixTitle + ' ' : '';
      const suffix = mentor.suffixTitle ? ', ' + mentor.suffixTitle : '';
      return { name: prefix + mentor.name + suffix, role: 'mentor', mentorId: mentor.id };
    }

    const [masterTeacher, masterStudent] = await Promise.all([
      orchestrator.masterTeacher.findByUserId(sentriUserId),
      orchestrator.masterStudent.findByUserId(sentriUserId)
    ]);

    if (masterTeacher) {
      const prefix = masterTeacher.prefixTitle ? masterTeacher.prefixTitle + ' ' : '';
      const suffix = masterTeacher.suffixTitle ? ', ' + masterTeacher.suffixTitle : '';
      return { name: prefix + masterTeacher.fullname + suffix, role: 'teacher', teacherId: null };
    }
    if (masterStudent) {
      return { name: masterStudent.fullname, role: 'student', studentId: null };
    }

    return { name: 'Super Admin', role: 'admin' };
  }

  async getMentorStats(mentorId: string, dateStr: string) {
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
    const [activeStudents, pendingLogbooks, checkInToday, checkOutToday, pendingAssessments, pendingCertificates, assessableStudents, completedStudents, totalPlacements, totalLogbooks] = await Promise.all([
      prisma.internshipPlacement.count({ where: { industryMentorId: mentorId, status: 'active', deletedAt: null } }),
      prisma.dailyLogbook.count({ where: { placement: { industryMentorId: mentorId }, mentorStatus: { not: 'approved' }, deletedAt: null } }),
      prisma.attendance.count({ where: { placement: { industryMentorId: mentorId, status: 'active', deletedAt: null }, type: 'check_in', status: 'accepted', date: startOfDay, deletedAt: null } }),
      prisma.attendance.count({ where: { placement: { industryMentorId: mentorId, status: 'active', deletedAt: null }, type: 'check_out', status: 'accepted', date: startOfDay, deletedAt: null } }),
      prisma.internshipPlacement.count({ where: { industryMentorId: mentorId, status: { in: ['active', 'completed'] }, isAssessable: true, deletedAt: null, assessments: { none: { assessorType: 'industry_mentor', deletedAt: null } } } }),
      prisma.internshipPlacement.count({ where: { industryMentorId: mentorId, status: 'completed', deletedAt: null, assessments: { none: { assessorType: 'industry_mentor', attachmentId: { not: null }, deletedAt: null } } } }),
      prisma.internshipPlacement.count({ where: { industryMentorId: mentorId, status: { in: ['active', 'completed'] }, isAssessable: true, deletedAt: null } }),
      prisma.internshipPlacement.count({ where: { industryMentorId: mentorId, status: 'completed', deletedAt: null } }),
      prisma.internshipPlacement.count({ where: { industryMentorId: mentorId, deletedAt: null } }),
      prisma.dailyLogbook.count({ where: { placement: { industryMentorId: mentorId, status: 'active' }, deletedAt: null } })
    ]);
    return {
      activeStudents: { current: activeStudents, total: totalPlacements },
      checkInToday: { current: checkInToday, total: activeStudents },
      checkOutToday: { current: checkOutToday, total: activeStudents },
      approvedLogbooks: { current: totalLogbooks - pendingLogbooks, total: totalLogbooks },
      completedAssessments: { current: assessableStudents - pendingAssessments, total: assessableStudents },
      uploadedCertificates: { current: completedStudents - pendingCertificates, total: completedStudents }
    };
  }

  async getTeacherStats(teacherId: string, dateStr: string) {
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
    const [activeStudents, pendingLogbooks, checkInToday, checkOutToday, pendingAssessments, assessableStudents, totalPlacements, totalLogbooks] = await Promise.all([
      prisma.internshipPlacement.count({ where: { teacherId, status: 'active', deletedAt: null } }),
      prisma.dailyLogbook.count({ where: { placement: { teacherId }, teacherStatus: { not: 'approved' }, deletedAt: null } }),
      prisma.attendance.count({ where: { placement: { teacherId, status: 'active', deletedAt: null }, type: 'check_in', status: 'accepted', date: startOfDay, deletedAt: null } }),
      prisma.attendance.count({ where: { placement: { teacherId, status: 'active', deletedAt: null }, type: 'check_out', status: 'accepted', date: startOfDay, deletedAt: null } }),
      prisma.internshipPlacement.count({ where: { teacherId, status: { in: ['active', 'completed'] }, isAssessable: true, deletedAt: null, assessments: { none: { assessorType: 'teacher', deletedAt: null } } } }),
      prisma.internshipPlacement.count({ where: { teacherId, status: { in: ['active', 'completed'] }, isAssessable: true, deletedAt: null } }),
      prisma.internshipPlacement.count({ where: { teacherId, deletedAt: null } }),
      prisma.dailyLogbook.count({ where: { placement: { teacherId, status: 'active' }, deletedAt: null } })
    ]);
    return {
      activeStudents: { current: activeStudents, total: totalPlacements },
      checkInToday: { current: checkInToday, total: activeStudents },
      checkOutToday: { current: checkOutToday, total: activeStudents },
      approvedLogbooks: { current: totalLogbooks - pendingLogbooks, total: totalLogbooks },
      completedAssessments: { current: assessableStudents - pendingAssessments, total: assessableStudents }
    };
  }

  async getStudentStats(studentId: string, dateStr: string) {
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const [totalPlacements, activePlacements, checkInToday, checkOutToday, totalLogbooks, approvedLogbooks, completedPlacements, placementsWithCertificate] = await Promise.all([
      prisma.internshipPlacement.count({ where: { studentId, deletedAt: null } }),
      prisma.internshipPlacement.count({ where: { studentId, status: 'active', deletedAt: null } }),
      prisma.attendance.count({ where: { placement: { studentId, status: 'active', deletedAt: null }, type: 'check_in', date: startOfDay, deletedAt: null } }),
      prisma.attendance.count({ where: { placement: { studentId, status: 'active', deletedAt: null }, type: 'check_out', date: startOfDay, deletedAt: null } }),
      prisma.dailyLogbook.count({ where: { placement: { studentId, status: 'active', deletedAt: null }, deletedAt: null } }),
      prisma.dailyLogbook.count({ where: { placement: { studentId, status: 'active', deletedAt: null }, mentorStatus: 'approved', teacherStatus: 'approved', deletedAt: null } }),
      prisma.internshipPlacement.count({ where: { studentId, status: 'completed', deletedAt: null } }),
      prisma.internshipPlacement.count({ where: { studentId, deletedAt: null, assessments: { some: { attachmentId: { not: null }, deletedAt: null } } } })
    ]);
    return {
      activeInternships: { current: activePlacements, total: totalPlacements },
      checkInToday: { current: checkInToday, total: activePlacements },
      checkOutToday: { current: checkOutToday, total: activePlacements },
      approvedLogbooks: { current: approvedLogbooks, total: totalLogbooks },
      gradedInternships: { current: completedPlacements, total: totalPlacements },
      uploadedCertificates: { current: placementsWithCertificate, total: totalPlacements }
    };
  }
}
