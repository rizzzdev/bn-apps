import { Router } from 'express';
import { dashboardController } from '../controller/dashboard.controller.js';

export const dashboardRoute = Router();

dashboardRoute.get('/admin', dashboardController.getAdminDashboard);
dashboardRoute.get('/mentor', dashboardController.getMentorDashboard);
dashboardRoute.get('/teacher', dashboardController.getTeacherDashboard);
dashboardRoute.get('/student', dashboardController.getStudentDashboard);
dashboardRoute.get('/profile', dashboardController.getProfileName);
