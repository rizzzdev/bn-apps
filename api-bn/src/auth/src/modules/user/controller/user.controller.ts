import { Request, Response, NextFunction } from 'express';
import { UserService, userService } from '../service/user.service.js';
import { sendResponse } from '@app/index.js';

export class UserController {
  constructor(private service: UserService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || undefined;
      const { data, meta } = await this.service.getAll(page, limit, search);
      const pagination = { currentPage: meta.page, totalPage: meta.totalPages, totalData: meta.total, dataPerPage: meta.limit };
      sendResponse(res, 200, 'Berhasil mengambil data user', data, pagination);
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id as string);
      sendResponse(res, 200, 'Berhasil mengambil data user', data);
    } catch (error) { next(error); }
  };

  updateRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updateRoles(req.params.id as string, req.body);
      sendResponse(res, 200, 'Berhasil memperbarui roles', data);
    } catch (error) { next(error); }
  };

  // --- Batch operations (standar) ---

  bulkUpdateRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.bulkUpdateRoles(req.body);
      const count = Array.isArray(data) ? data.length : (typeof data === 'number' ? data : 0);
      sendResponse(res, 200, `Berhasil memperbarui roles ${count} user`, { count, items: Array.isArray(data) ? data : undefined });
    } catch (error) { next(error); }
  };

  getRoles = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const validRoles = ["industry_mentor", "student", "super_admin", "teacher"];
      const rolesData = validRoles.map(r => ({
        id: r,
        name: r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Akses sistem sebagai ${r}`,
      }));
      sendResponse(res, 200, 'Berhasil mengambil data roles', rolesData);
    } catch (error) { next(error); }
  };
}

export const userController = new UserController(userService);
