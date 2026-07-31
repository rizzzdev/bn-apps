import { sendResponse } from '../../../utils/response';
import { SentriError } from 'sentri/core';
export class QuizSubmissionController {
    service;
    constructor(service) {
        this.service = service;
    }
    startQuiz = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('student') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Murid yang dapat mengerjakan kuis', 403);
            }
            const { quizId } = req.params;
            const data = await this.service.startQuiz(quizId, req.profileId);
            sendResponse(res, 201, 'Sesi kuis dimulai', data);
        }
        catch (error) {
            next(error);
        }
    };
    getMySubmission = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('student') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Murid yang dapat mengakses ini', 403);
            }
            const { quizId } = req.params;
            const data = await this.service.getMySubmission(quizId, req.profileId);
            sendResponse(res, 200, 'Berhasil mengambil sesi kuis', data);
        }
        catch (error) {
            next(error);
        }
    };
    finishQuiz = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('student') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Murid yang dapat menyelesaikan kuis', 403);
            }
            const { quizId } = req.params;
            const data = await this.service.finishQuiz(quizId, req.profileId, req.body);
            sendResponse(res, 200, 'Kuis berhasil diselesaikan', data);
        }
        catch (error) {
            next(error);
        }
    };
    getAllSubmissions = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat melihat semua pengerjaan', 403);
            }
            const { quizId } = req.params;
            const data = await this.service.getAllSubmissions(quizId, req.profileId);
            sendResponse(res, 200, 'Berhasil mengambil daftar pengerjaan kuis', data);
        }
        catch (error) {
            next(error);
        }
    };
}
import { quizSubmissionService } from '../service/quiz-submission.service';
export const quizSubmissionController = new QuizSubmissionController(quizSubmissionService);
