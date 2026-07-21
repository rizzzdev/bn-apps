import { prisma } from '@/database';
import { SubmitAssignmentDto, GradeAssignmentDto } from '../domain/schemas';

export class AssignmentSubmissionRepository {
  async submit(assignmentId: string, studentId: string, data: SubmitAssignmentDto) {
    return prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      update: {
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        createdAt: new Date(),
      },
      create: {
        assignmentId,
        studentId,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      },
    });
  }

  async findByAssignmentAndStudent(assignmentId: string, studentId: string) {
    return prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });
  }

  async findAllByAssignment(assignmentId: string) {
    return prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { id: true, fullname: true, nis: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          select: { id: true, teacherId: true, deadline: true },
        },
      },
    });
  }

  async grade(id: string, data: GradeAssignmentDto) {
    return prisma.assignmentSubmission.update({
      where: { id },
      data: {
        grade: data.grade,
        feedback: data.feedback,
      },
    });
  }
}

export const assignmentSubmissionRepository = new AssignmentSubmissionRepository();
