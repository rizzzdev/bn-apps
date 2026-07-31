import { SentriError } from 'sentri/core';
import { submitAssignmentSchema, gradeAssignmentSchema, bulkGradeSchema } from '../domain/schemas';
import { assignmentRepository } from '../../../modules/assignment/repository/assignment.repository';
export class AssignmentSubmissionService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async submit(assignmentId, studentId, data) {
        const assignment = await assignmentRepository.findById(assignmentId);
        if (!assignment) {
            throw new SentriError('NOT_FOUND', 'Tugas tidak ditemukan', 404);
        }
        // Optional: check deadline
        if (new Date() > assignment.deadline) {
            throw new SentriError('BAD_REQUEST', 'Batas waktu pengumpulan tugas telah berakhir', 400);
        }
        const parsed = submitAssignmentSchema.parse(data);
        return this.repository.submit(assignmentId, studentId, parsed);
    }
    async getMySubmission(assignmentId, studentId) {
        return this.repository.findByAssignmentAndStudent(assignmentId, studentId);
    }
    async getAllSubmissions(assignmentId, teacherId) {
        const assignment = await assignmentRepository.findById(assignmentId);
        if (!assignment) {
            throw new SentriError('NOT_FOUND', 'Tugas tidak ditemukan', 404);
        }
        if (assignment.teacherId !== teacherId) {
            throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses ke tugas ini', 403);
        }
        return this.repository.findAllByAssignment(assignmentId);
    }
    async gradeSubmission(submissionId, teacherId, data) {
        const submission = await this.repository.findById(submissionId);
        if (!submission) {
            throw new SentriError('NOT_FOUND', 'Pengumpulan tugas tidak ditemukan', 404);
        }
        if (submission.assignment.teacherId !== teacherId) {
            throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses untuk menilai tugas ini', 403);
        }
        const parsed = gradeAssignmentSchema.parse(data);
        return this.repository.grade(submissionId, parsed);
    }
    async bulkGradeSubmissions(teacherId, data) {
        const parsed = bulkGradeSchema.parse(data);
        const submissionIds = parsed.grades.map((g) => g.submissionId);
        const submissions = await this.repository.findAllByIds(submissionIds);
        for (const sub of submissions) {
            if (sub.assignment?.teacherId !== teacherId) {
                throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses untuk menilai salah satu tugas ini', 403);
            }
        }
        return this.repository.bulkGrade(parsed.grades);
    }
}
import { assignmentSubmissionRepository } from '../repository/assignment-submission.repository';
export const assignmentSubmissionService = new AssignmentSubmissionService(assignmentSubmissionRepository);
