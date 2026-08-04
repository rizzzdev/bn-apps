import { SentriError } from 'sentri/core';
import { QuizSubmissionRepository } from '../repository/quiz-submission.repository';
import { FinishQuizDto, finishQuizSchema } from '../domain/schemas';
import { quizRepository } from '#/modules/quiz/repository/quiz.repository';

export class QuizSubmissionService {
  constructor(private repository: QuizSubmissionRepository) {}

  async startQuiz(quizId: string, studentId: string) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new SentriError('NOT_FOUND', 'Kuis tidak ditemukan', 404);

    return this.repository.startQuiz(quizId, studentId);
  }

  async getMySubmission(quizId: string, studentId: string) {
    return this.repository.findActiveSubmission(quizId, studentId);
  }

  async finishQuiz(quizId: string, studentId: string, data: FinishQuizDto) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new SentriError('NOT_FOUND', 'Kuis tidak ditemukan', 404);

    const submission = await this.repository.findActiveSubmission(quizId, studentId);
    if (!submission) {
      throw new SentriError('BAD_REQUEST', 'Sesi kuis belum dimulai', 400);
    }
    if (submission.finishedAt) {
      throw new SentriError('BAD_REQUEST', 'Kuis sudah diselesaikan', 400);
    }

    // Optional: check time limit if strict
    if (quiz.timeLimit) {
      const elapsedMinutes = (new Date().getTime() - submission.startedAt.getTime()) / 60000;
      // Allow 1 minute grace period
      if (elapsedMinutes > quiz.timeLimit + 1) {
        // can auto-submit or mark 0
      }
    }

    const parsed = finishQuizSchema.parse(data);

    // Calculate score
    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    // Create a map for fast lookup
    interface QuizQuestion { id: string; correctOption: number; }
    const questionMap = new Map<string, QuizQuestion>(quiz.questions.map((q: { id: string }) => [q.id, q as QuizQuestion]));

    for (const answer of parsed.answers) {
      const question = questionMap.get(answer.quizQuestionId);
      if (question && question.correctOption === answer.selectedOption) {
        correctCount++;
      }
    }

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return this.repository.finishQuiz(submission.id, parsed, score);
  }

  async getAllSubmissions(quizId: string, teacherId: string) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new SentriError('NOT_FOUND', 'Kuis tidak ditemukan', 404);
    if (quiz.teacherId !== teacherId) {
      throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses ke kuis ini', 403);
    }

    return this.repository.findAllByQuiz(quizId);
  }
}

import { quizSubmissionRepository } from '../repository/quiz-submission.repository';
export const quizSubmissionService = new QuizSubmissionService(quizSubmissionRepository);
