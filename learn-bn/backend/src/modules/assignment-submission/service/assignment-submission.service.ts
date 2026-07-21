import { SentriError } from 'sentri/core';
import { AssignmentSubmissionRepository } from '../repository/assignment-submission.repository';
import { SubmitAssignmentDto, GradeAssignmentDto, submitAssignmentSchema, gradeAssignmentSchema } from '../domain/schemas';
import { assignmentRepository } from '@/modules/assignment/repository/assignment.repository';

export class AssignmentSubmissionService {
  constructor(private repository: AssignmentSubmissionRepository) {}

  async submit(assignmentId: string, studentId: string, data: SubmitAssignmentDto) {
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

  async getMySubmission(assignmentId: string, studentId: string) {
    return this.repository.findByAssignmentAndStudent(assignmentId, studentId);
  }

  async getAllSubmissions(assignmentId: string, teacherId: string) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new SentriError('NOT_FOUND', 'Tugas tidak ditemukan', 404);
    }
    if (assignment.teacherId !== teacherId) {
      throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses ke tugas ini', 403);
    }

    return this.repository.findAllByAssignment(assignmentId);
  }

  async gradeSubmission(submissionId: string, teacherId: string, data: GradeAssignmentDto) {
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
}

import { assignmentSubmissionRepository } from '../repository/assignment-submission.repository';
export const assignmentSubmissionService = new AssignmentSubmissionService(assignmentSubmissionRepository);
