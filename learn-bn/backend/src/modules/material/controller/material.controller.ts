import { Request, Response, NextFunction } from 'express';
import { MaterialService } from '../service/material.service';
import { sendResponse } from '@/utils/response';
import { SentriError } from 'sentri/core';

export class MaterialController {
  constructor(private service: MaterialService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat membuat materi', 403);
      }
      
      const data = await this.service.create(req.body, req.profileId!);
      sendResponse(res, 201, 'Materi berhasil dibuat', data);
    } catch (error) {
      next(error);
    }
  };

  getByClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classId } = req.params as { classId: string };
      const data = await this.service.getByClass(classId);
      sendResponse(res, 200, 'Berhasil mengambil materi kelas', data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      const data = await this.service.getById(id);
      sendResponse(res, 200, 'Berhasil mengambil detail materi', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat mengubah materi', 403);
      }

      const { id } = req.params as { id: string };
      const data = await this.service.update(id, req.body, req.profileId!);
      sendResponse(res, 200, 'Materi berhasil diperbarui', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat menghapus materi', 403);
      }

      const { id } = req.params as { id: string };
      await this.service.delete(id, req.profileId!);
      sendResponse(res, 200, 'Materi berhasil dihapus');
    } catch (error) {
      next(error);
    }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat menghapus materi', 403);
      }

      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        throw new SentriError('BAD_REQUEST', 'IDs tidak valid', 400);
      }
      
      await this.service.bulkDelete(ids, req.profileId!);
      sendResponse(res, 200, 'Materi berhasil dihapus secara massal');
    } catch (error) {
      next(error);
    }
  };
}

import { materialService } from '../service/material.service';
export const materialController = new MaterialController(materialService);
