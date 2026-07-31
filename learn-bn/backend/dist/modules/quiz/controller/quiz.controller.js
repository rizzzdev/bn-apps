import { sendResponse } from '../../../utils/response';
import { SentriError } from 'sentri/core';
export class QuizController {
    service;
    constructor(service) {
        this.service = service;
    }
    create = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat membuat kuis', 403);
            }
            const data = await this.service.create(req.body, req.profileId);
            sendResponse(res, 201, 'Kuis berhasil dibuat', data);
        }
        catch (error) {
            next(error);
        }
    };
    bulkCreate = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat membuat kuis', 403);
            }
            const data = await this.service.bulkCreate(req.body, req.profileId);
            sendResponse(res, 201, 'Kuis berhasil dibuat untuk kelas terdaftar', data);
        }
        catch (error) {
            next(error);
        }
    };
    getByClass = async (req, res, next) => {
        try {
            const { classId } = req.params;
            const role = req.user?.roles[0];
            const data = await this.service.getByClass(classId, role);
            sendResponse(res, 200, 'Berhasil mengambil kuis kelas', data);
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            if (!req.user)
                throw new SentriError('UNAUTHORIZED', 'Belum login', 401);
            const { id } = req.params;
            const role = req.user.roles[0];
            const data = await this.service.getById(id, role);
            sendResponse(res, 200, 'Berhasil mengambil detail kuis', data);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat mengubah kuis', 403);
            }
            const { id } = req.params;
            const data = await this.service.update(id, req.body, req.profileId);
            sendResponse(res, 200, 'Kuis berhasil diperbarui', data);
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat menghapus kuis', 403);
            }
            const { id } = req.params;
            await this.service.delete(id, req.profileId);
            sendResponse(res, 200, 'Kuis berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    };
    bulkDelete = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat menghapus kuis', 403);
            }
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                throw new SentriError('BAD_REQUEST', 'IDs tidak valid', 400);
            }
            await this.service.bulkDelete(ids, req.profileId);
            sendResponse(res, 200, 'Kuis berhasil dihapus secara massal');
        }
        catch (error) {
            next(error);
        }
    };
}
import { quizService } from '../service/quiz.service';
export const quizController = new QuizController(quizService);
