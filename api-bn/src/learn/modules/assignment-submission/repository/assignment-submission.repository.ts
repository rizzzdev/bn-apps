import { prisma } from '#learn/database/index.js';
import { shadowSyncService } from '../../../services/shadow-sync.service.js';
import { SubmitAssignmentDto, GradeAssignmentDto } from '../domain/schemas.js';
import { fetchStudentNames } from '../../common/hydrate.js';

export class AssignmentSubmissionRepository {
  async submit(assignmentId: string, studentId: string, data: SubmitAssignmentDto) {
    const baseData = {
      assignmentId, studentId,
      fileUrl: data.fileUrl || null,
      fileName: data.fileName || null,
      content: data.content || null,
    };
    return prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      update: {
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
        ...(data.fileName !== undefined && { fileName: data.fileName }),
        ...(data.content !== undefined && { content: data.content }),
        createdAt: new Date(),
      },
      create: baseData,
    });
  }

  async findByAssignmentAndStudent(assignmentId: string, studentId: string) {
    return prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
  }

  async findAllByAssignment(assignmentId: string) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { classes: { select: { classId: true } } },
    });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
    });

    if (!assignment || assignment.classes.length === 0) {
      const studentIds = submissions.map((s) => s.studentId);
      const studentMap = await fetchStudentNames(studentIds);
      return submissions.map((s) => ({
        id: s.id, studentId: s.studentId,
        student: studentMap.get(s.studentId) ?? { id: s.studentId, fullname: '', nis: null, nisn: null, pictureUrl: null },
        createdAt: s.createdAt, fileUrl: s.fileUrl, fileName: s.fileName,
        content: s.content, grade: s.grade, feedback: s.feedback, submission: s,
      }));
    }

    const classIds = assignment.classes.map((c) => c.classId);
    const [csRecords, shadowClasses] = await Promise.all([
      prisma.shadowClassStudent.findMany({
        where: { classId: { in: classIds }, status: 'Aktif', deletedAt: null },
      }),
      prisma.shadowClass.findMany({
        where: { id: { in: classIds }, deletedAt: null },
      }),
    ]);
    const classMap = new Map(shadowClasses.map((c) => [c.id, c]));

    const studentIds = [...new Set([...submissions.map((s) => s.studentId), ...csRecords.map((cs) => cs.studentId)])];
    const studentMap = await fetchStudentNames(studentIds);
    const submissionMap = new Map(submissions.map((s) => [s.studentId, s]));

    return csRecords.map((cs) => {
      const sub = submissionMap.get(cs.studentId);
      return {
        id: sub?.id, studentId: cs.studentId,
        student: studentMap.get(cs.studentId) ?? { id: cs.studentId, fullname: '', nis: null, nisn: null, pictureUrl: null },
        class: classMap.get(cs.classId) ?? { id: cs.classId, name: '' },
        createdAt: sub?.createdAt || null,
        fileUrl: sub?.fileUrl || null, fileName: sub?.fileName || null,
        content: sub?.content || null, grade: sub?.grade ?? null,
        feedback: sub?.feedback || null, submission: sub || null,
      };
    });
  }

  async findById(id: string) {
    return prisma.assignmentSubmission.findUnique({
      where: { id },
      include: { assignment: { select: { id: true, teacherId: true, deadline: true, title: true } } },
    });
  }

  async grade(id: string, data: GradeAssignmentDto) {
    return prisma.assignmentSubmission.update({
      where: { id },
      data: { grade: data.grade, feedback: data.feedback },
    });
  }

  async findAllByIds(ids: string[]) {
    return prisma.assignmentSubmission.findMany({
      where: { id: { in: ids } },
      include: { assignment: { select: { id: true, teacherId: true } } },
    });
  }

  async bulkGrade(grades: { submissionId: string; grade: number; feedback?: string }[]) {
    const updates = grades.map((g) =>
      prisma.assignmentSubmission.update({
        where: { id: g.submissionId },
        data: { grade: g.grade, feedback: g.feedback },
      })
    );
    return prisma.$transaction(updates);
  }
}

export const assignmentSubmissionRepository = new AssignmentSubmissionRepository();
