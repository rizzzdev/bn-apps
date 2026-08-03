import { SentriError } from 'sentri/core';
import { prisma } from '@learn/database/index.js';
import { shadowSyncService } from '../../../services/shadow-sync.service.js';
import { GradeRepository } from '../repository/grade.repository.js';
import { getOrchestrator } from '../../common/hydrate.js';

export class GradeService {
  constructor(private repository: GradeRepository) {}

  async getMyGrades(classId: string, studentId: string) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    let classStudent = await prisma.shadowClassStudent.findFirst({
      where: { classId, studentId, status: 'Aktif', deletedAt: null },
    });

    if (!classStudent) {
      // Fallback: coba dari orchestrator jika shadow DB belum terisi
      try {
        const cs = await getOrchestrator().academicClassStudent.findFirst({
          classId, studentId, status: 'Aktif',
        });
        if (cs) classStudent = cs as any;
      } catch {
        // Master down, abaikan error
      }
    }

    if (!classStudent) {
      throw new SentriError('FORBIDDEN', 'Anda tidak terdaftar di kelas ini', 403);
    }

    const raw = await this.repository.getStudentGradesByClass(classId, studentId);

    const assignments = raw.assignments.map((sub: { assignmentId: string; assignment?: { title?: string; deadline?: Date }; createdAt: Date; fileUrl: string | null; content: string | null; grade: number | null }) => {
      let status = 'not_submitted';
      if (sub.grade !== null) status = 'graded';
      else if (sub.fileUrl || sub.content) status = 'pending';

      return {
        id: sub.assignmentId,
        title: sub.assignment?.title || 'Unknown',
        deadline: sub.assignment?.deadline?.toISOString() || sub.createdAt?.toISOString(),
        grade: sub.grade,
        status,
      };
    });

    const quizzes = raw.quizzes.map((sub: { quizId: string; quiz?: { title?: string }; score?: number | null }) => ({
      id: sub.quizId,
      title: sub.quiz?.title || 'Unknown',
      score: sub.score,
    }));

    return { assignments, quizzes };
  }

  async getClassGrades(classId: string, teacherId: string) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    let classExists = await prisma.shadowClass.findFirst({
      where: { id: classId, deletedAt: null },
    });

    if (!classExists) {
      // Fallback: coba dari orchestrator jika shadow DB belum terisi
      try {
        const c = await getOrchestrator().masterClass.findById(classId);
        if (c) classExists = c as any;
      } catch {
        // Master down, abaikan error
      }
    }

    if (!classExists) {
      throw new SentriError('NOT_FOUND', 'Kelas tidak ditemukan', 404);
    }

    const data = await this.repository.getClassGrades(classId);

    // Format the data into a tabular structure
    const students = data.classStudents.map((cs) => {
      const studentGrades = {
        student: cs.student,
        assignments: data.assignments.map((a) => {
          const sub = data.assignmentSubmissions.find((s) => s.assignmentId === a.id && s.studentId === cs.student.id);
          return { id: a.id, title: a.title, grade: sub?.grade ?? null };
        }),
        quizzes: data.quizzes.map((q) => {
          const sub = data.quizSubmissions.find((s) => s.quizId === q.id && s.studentId === cs.student.id);
          return { id: q.id, title: q.title, score: sub?.score ?? null };
        }),
      };
      return studentGrades;
    });

    return {
      classInfo: classExists,
      assignments: data.assignments,
      quizzes: data.quizzes,
      students,
    };
  }
}

import { gradeRepository } from '../repository/grade.repository.js';
export const gradeService = new GradeService(gradeRepository);
