import { prisma } from '../../../database';
export class AssignmentSubmissionRepository {
    async submit(assignmentId, studentId, data) {
        const baseData = {
            assignmentId,
            studentId,
            fileUrl: data.fileUrl || null,
            fileName: data.fileName || null,
            content: data.content || null,
        };
        return prisma.assignmentSubmission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId,
                },
            },
            update: {
                ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
                ...(data.fileName !== undefined && { fileName: data.fileName }),
                ...(data.content !== undefined && { content: data.content }),
                createdAt: new Date(),
            },
            create: baseData,
        });
    }
    async findByAssignmentAndStudent(assignmentId, studentId) {
        return prisma.assignmentSubmission.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId,
                },
            },
        });
    }
    async findAllByAssignment(assignmentId) {
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            select: { classes: { select: { classId: true } } },
        });
        const submissions = await prisma.assignmentSubmission.findMany({
            where: { assignmentId },
            include: {
                student: {
                    select: { id: true, fullname: true, nis: true, pictureUrl: true },
                },
            },
        });
        if (!assignment || assignment.classes.length === 0) {
            return submissions.map((s) => ({
                id: s.id,
                studentId: s.studentId,
                student: s.student,
                createdAt: s.createdAt,
                fileUrl: s.fileUrl,
                fileName: s.fileName,
                content: s.content,
                grade: s.grade,
                feedback: s.feedback,
                submission: s,
            }));
        }
        const classIds = assignment.classes.map((c) => c.classId);
        const classStudents = await prisma.classStudent.findMany({
            where: { classId: { in: classIds }, status: 'Aktif', deletedAt: null },
            include: {
                class: {
                    select: { id: true, name: true },
                },
                student: {
                    select: { id: true, fullname: true, nis: true, pictureUrl: true },
                },
            },
            orderBy: [{ class: { name: 'asc' } }, { student: { fullname: 'asc' } }],
        });
        const submissionMap = new Map(submissions.map((s) => [s.studentId, s]));
        return classStudents.map((cs) => {
            const sub = submissionMap.get(cs.student.id);
            return {
                id: sub?.id,
                studentId: cs.student.id,
                student: cs.student,
                class: cs.class,
                createdAt: sub?.createdAt || null,
                fileUrl: sub?.fileUrl || null,
                fileName: sub?.fileName || null,
                content: sub?.content || null,
                grade: sub?.grade ?? null,
                feedback: sub?.feedback || null,
                submission: sub || null,
            };
        });
    }
    async findById(id) {
        return prisma.assignmentSubmission.findUnique({
            where: { id },
            include: {
                assignment: {
                    select: { id: true, teacherId: true, deadline: true, title: true },
                },
            },
        });
    }
    async grade(id, data) {
        return prisma.assignmentSubmission.update({
            where: { id },
            data: {
                grade: data.grade,
                feedback: data.feedback,
            },
        });
    }
    async findAllByIds(ids) {
        return prisma.assignmentSubmission.findMany({
            where: { id: { in: ids } },
            include: {
                assignment: {
                    select: { id: true, teacherId: true },
                },
            },
        });
    }
    async bulkGrade(grades) {
        const updates = grades.map((g) => prisma.assignmentSubmission.update({
            where: { id: g.submissionId },
            data: { grade: g.grade, feedback: g.feedback },
        }));
        return prisma.$transaction(updates);
    }
}
export const assignmentSubmissionRepository = new AssignmentSubmissionRepository();
