import { teacherService } from '../service';
import { sendResponse } from '../../../utils/response';
export class TeacherController {
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
}
export const teacherController = new TeacherController(teacherService);
