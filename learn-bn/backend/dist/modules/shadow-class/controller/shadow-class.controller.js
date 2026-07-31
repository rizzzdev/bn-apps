import { classService } from '../service';
import { sendResponse } from '../../../utils/response';
import { SentriError } from 'sentri/core';
export class ClassController {
    service;
    constructor(service) {
        this.service = service;
    }
    getAll = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const { data, total } = await this.service.getAll(page, limit);
            sendResponse(res, 200, 'Berhasil mengambil data', data, {
                currentPage: page,
                totalPage: Math.ceil(total / limit) || 1,
                totalData: total,
                dataPerPage: limit,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getByTeacher = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && !req.user?.roles.includes('teacher')) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat mengakses ini', 403);
            }
            const data = await this.service.getByTeacher(req.profileId);
            sendResponse(res, 200, 'Berhasil mengambil daftar kelas', data);
        }
        catch (error) {
            next(error);
        }
    };
    getByStudent = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && !req.user?.roles.includes('student')) {
                throw new SentriError('FORBIDDEN', 'Hanya Siswa yang dapat mengakses ini', 403);
            }
            const data = await this.service.getByStudent(req.profileId);
            sendResponse(res, 200, 'Berhasil mengambil daftar kelas siswa', data);
        }
        catch (error) {
            next(error);
        }
    };
    getStudents = async (req, res, next) => {
        try {
            const { classId } = req.params;
            const data = await this.service.getStudentsByClass(classId);
            sendResponse(res, 200, 'Berhasil mengambil daftar siswa', data);
        }
        catch (error) {
            next(error);
        }
    };
}
export const classController = new ClassController(classService);
