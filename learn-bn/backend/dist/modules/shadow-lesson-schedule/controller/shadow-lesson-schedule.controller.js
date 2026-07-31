import { lessonScheduleService } from '../service';
import { sendResponse } from '../../../utils/response';
export class LessonScheduleController {
    service;
    constructor(service) {
        this.service = service;
    }
    getAll = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const teacherId = req.query.teacherId || (req.user?.roles?.includes('teacher') ? req.profileId : undefined);
            const limit = parseInt(req.query.limit) || (teacherId ? 100 : 10);
            const { data, total } = await this.service.getAll(page, limit, teacherId);
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
    getByStudent = async (req, res, next) => {
        try {
            const rawParam = req.params.studentId;
            const paramId = Array.isArray(rawParam) ? rawParam[0] : rawParam;
            const studentId = (!paramId || paramId === 'my' || paramId === 'undefined') ? req.profileId : paramId;
            if (!studentId) {
                sendResponse(res, 200, 'Berhasil mengambil data', []);
                return;
            }
            const data = await this.service.getByStudent(studentId);
            sendResponse(res, 200, 'Berhasil mengambil data', data);
        }
        catch (error) {
            next(error);
        }
    };
}
export const lessonScheduleController = new LessonScheduleController(lessonScheduleService);
