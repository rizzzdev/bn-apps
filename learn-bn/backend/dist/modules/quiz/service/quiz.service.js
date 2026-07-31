import { SentriError } from 'sentri/core';
import { createQuizSchema, updateQuizSchema } from '../domain/schemas';
export class QuizService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(data, teacherId) {
        const parsed = createQuizSchema.parse(data);
        return this.repository.create(parsed, teacherId);
    }
    async bulkCreate(data, teacherId) {
        const parsed = createQuizSchema.parse(data);
        return this.repository.bulkCreate(parsed, teacherId);
    }
    async getByClass(classId, role) {
        return this.repository.findAllByClass(classId, role);
    }
    async getById(id, role) {
        const quiz = await this.repository.findById(id);
        if (!quiz) {
            throw new SentriError('NOT_FOUND', 'Kuis tidak ditemukan', 404);
        }
        // If accessed by student, strip out correctOption
        if (role === 'MURID') {
            const sanitizedQuestions = quiz.questions.map((q) => {
                const { correctOption, ...rest } = q;
                return rest;
            });
            return { ...quiz, questions: sanitizedQuestions };
        }
        return quiz;
    }
    async update(id, data, teacherId) {
        const quiz = await this.repository.findById(id);
        if (!quiz)
            throw new SentriError('NOT_FOUND', 'Kuis tidak ditemukan', 404);
        if (quiz.teacherId !== teacherId) {
            throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses untuk mengubah kuis ini', 403);
        }
        const parsed = updateQuizSchema.parse(data);
        return this.repository.update(id, parsed);
    }
    async delete(id, teacherId) {
        const quiz = await this.repository.findById(id);
        if (!quiz)
            throw new SentriError('NOT_FOUND', 'Kuis tidak ditemukan', 404);
        if (quiz.teacherId !== teacherId) {
            throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses untuk menghapus kuis ini', 403);
        }
        return this.repository.delete(id);
    }
    async bulkDelete(ids, teacherId) {
        return this.repository.bulkDelete(ids);
    }
}
import { quizRepository } from '../repository/quiz.repository';
export const quizService = new QuizService(quizRepository);
