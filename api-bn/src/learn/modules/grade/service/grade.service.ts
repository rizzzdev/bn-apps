import { SentriError } from 'sentri/core';
import { GradeRepository } from '../repository/grade.repository';
import { getOrchestrator } from '../../common/hydrate';

export class GradeService {
  constructor(private repository: GradeRepository) {}

  async getMyGrades(classId: string, studentId: string) {
    const classStudent = await getOrchestrator().academicClassStudent.findFirst({
      classId, studentId, status: 'Aktif',
    });
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
    const classExists = await getOrchestrator().masterClass.findById(classId);
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

import { gradeRepository } from '../repository/grade.repository';
export const gradeService = new GradeService(gradeRepository);
