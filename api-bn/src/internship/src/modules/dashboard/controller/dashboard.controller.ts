import { Request, Response } from 'express';
import { DashboardService } from '../service/dashboard.service.js';
import { sendResponse } from '#app';

const dashboardService = new DashboardService();

export class DashboardController {
  async getAdminDashboard(req: Request, res: Response) {
    try {
      const stats = await dashboardService.getAdminStats();
      return sendResponse(res, 200, 'Admin dashboard metrics retrieved successfully', stats);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return sendResponse(res, 500, message, null, undefined, true);
    }
  }

  async getProfileName(req: Request, res: Response) {
    try {
      const email = req.query.email as string || (req.user as { identifiers?: Array<{ type: string; value: string }> })?.identifiers?.find((i) => i.type === 'email')?.value;
      if (!email) {
        return sendResponse(res, 400, 'User email not found in request', null, undefined, true);
      }

      const profileData = await dashboardService.getProfileNameByEmail(email);
      return sendResponse(res, 200, 'Profile name retrieved successfully', profileData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return sendResponse(res, 500, message, null, undefined, true);
    }
  }
  async getMentorDashboard(req: Request, res: Response) {
    try {
      const email = req.query.email as string || (req.user as { identifiers?: Array<{ type: string; value: string }> })?.identifiers?.find((i) => i.type === 'email')?.value;
      if (!email) {
        return sendResponse(res, 400, 'User email not found in request', null, undefined, true);
      }
      const profile = await dashboardService.getProfileNameByEmail(email);
      if (profile.role !== 'mentor' || !profile.mentorId) {
        return sendResponse(res, 403, 'User is not a mentor', null, undefined, true);
      }
      const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
      const stats = await dashboardService.getMentorStats(profile.mentorId, dateStr);
      return sendResponse(res, 200, 'Mentor dashboard metrics retrieved successfully', stats);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return sendResponse(res, 500, message, null, undefined, true);
    }
  }

  async getTeacherDashboard(req: Request, res: Response) {
    try {
      const email = req.query.email as string || (req.user as { identifiers?: Array<{ type: string; value: string }> })?.identifiers?.find((i) => i.type === 'email')?.value;
      if (!email) {
        return sendResponse(res, 400, 'User email not found in request', null, undefined, true);
      }
      const profile = await dashboardService.getProfileNameByEmail(email);
      if (profile.role !== 'teacher' || !profile.teacherId) {
        return sendResponse(res, 403, 'User is not a teacher in internship system', null, undefined, true);
      }
      const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
      const stats = await dashboardService.getTeacherStats(profile.teacherId, dateStr);
      return sendResponse(res, 200, 'Teacher dashboard metrics retrieved successfully', stats);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return sendResponse(res, 500, message, null, undefined, true);
    }
  }

  async getStudentDashboard(req: Request, res: Response) {
    try {
      const email = req.query.email as string;
      const sentriId = req.user?.id;
      let profile;
      if (email) {
        profile = await dashboardService.getProfileNameByEmail(email);
      } else if (sentriId) {
        profile = await dashboardService.getProfileNameById(sentriId);
      } else {
        return sendResponse(res, 400, 'User email not found in request', null, undefined, true);
      }
      if (profile.role !== 'student' || !profile.studentId) {
        return sendResponse(res, 403, 'User is not a student in internship system', null, undefined, true);
      }
      const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
      const stats = await dashboardService.getStudentStats(profile.studentId, dateStr);
      return sendResponse(res, 200, 'Student dashboard metrics retrieved successfully', stats);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return sendResponse(res, 500, message, null, undefined, true);
    }
  }
}

export const dashboardController = new DashboardController();
