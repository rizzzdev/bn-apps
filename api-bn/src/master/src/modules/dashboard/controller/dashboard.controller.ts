import { Request, Response, NextFunction } from "express";
import {
  DashboardService,
  dashboardService,
} from '@master/modules/dashboard/service';
import { sendResponse } from '@app/index.js';

export class DashboardController {
  constructor(private service: DashboardService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getSummary();
      sendResponse(res, 200, "Success fetch summary", data);
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController(dashboardService);
