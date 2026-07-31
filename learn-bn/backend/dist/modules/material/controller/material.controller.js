import { sendResponse } from '../../../utils/response';
import { SentriError } from 'sentri/core';
export class MaterialController {
    service;
    constructor(service) {
        this.service = service;
    }
    create = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat membuat materi', 403);
            }
            const data = await this.service.create(req.body, req.profileId);
            sendResponse(res, 201, 'Materi berhasil dibuat', data);
        }
        catch (error) {
            next(error);
        }
    };
    getByClass = async (req, res, next) => {
        try {
            const { classId } = req.params;
            const isStudent = !req.user?.roles?.includes('teacher') && !req.user?.roles?.includes('super_admin');
            const studentId = isStudent ? req.profileId ?? undefined : undefined;
            const data = await this.service.getByClass(classId, isStudent, studentId);
            sendResponse(res, 200, 'Berhasil mengambil materi kelas', data);
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const isStudent = !req.user?.roles?.includes('teacher') && !req.user?.roles?.includes('super_admin');
            const studentId = isStudent ? req.profileId ?? undefined : undefined;
            const data = await this.service.getById(id, isStudent, studentId);
            sendResponse(res, 200, 'Berhasil mengambil detail materi', data);
        }
        catch (error) {
            next(error);
        }
    };
    markAsRead = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('student') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Siswa yang dapat mengonfirmasi baca materi', 403);
            }
            const { id } = req.params;
            const data = await this.service.markAsRead(id, req.profileId);
            sendResponse(res, 200, 'Materi berhasil ditandai telah dibaca', data);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat mengubah materi', 403);
            }
            const { id } = req.params;
            const data = await this.service.update(id, req.body, req.profileId);
            sendResponse(res, 200, 'Materi berhasil diperbarui', data);
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat menghapus materi', 403);
            }
            const { id } = req.params;
            await this.service.delete(id, req.profileId);
            sendResponse(res, 200, 'Materi berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    };
    bulkDelete = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat menghapus materi', 403);
            }
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                throw new SentriError('BAD_REQUEST', 'IDs tidak valid', 400);
            }
            await this.service.bulkDelete(ids, req.profileId);
            sendResponse(res, 200, 'Materi berhasil dihapus secara massal');
        }
        catch (error) {
            next(error);
        }
    };
}
import { materialService } from '../service/material.service';
export const materialController = new MaterialController(materialService);
