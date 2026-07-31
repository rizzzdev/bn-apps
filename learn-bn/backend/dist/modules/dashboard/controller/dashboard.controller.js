import { sendResponse } from '../../../utils/response';
import { SentriError } from 'sentri/core';
export class DashboardController {
    service;
    constructor(service) {
        this.service = service;
    }
    getTeacherPendingGrading = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat mengakses ini', 403);
            }
            const data = await this.service.getTeacherPendingGrading(req.profileId);
            sendResponse(res, 200, 'Berhasil mengambil data penilaian tertunda', data);
        }
        catch (error) {
            next(error);
        }
    };
    getStudentPendingItems = async (req, res, next) => {
        try {
            if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('student') || !req.profileId)) {
                throw new SentriError('FORBIDDEN', 'Hanya Murid yang dapat mengakses ini', 403);
            }
            const data = await this.service.getStudentPendingItems(req.profileId);
            sendResponse(res, 200, 'Berhasil mengambil data item tertunda', data);
        }
        catch (error) {
            next(error);
        }
    };
}
import { dashboardService } from '../service/dashboard.service';
export const dashboardController = new DashboardController(dashboardService);
