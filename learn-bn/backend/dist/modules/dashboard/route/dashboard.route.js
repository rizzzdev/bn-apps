import { Router } from 'express';
import { dashboardController } from '../controller/dashboard.controller';
export const dashboardRoute = Router();
dashboardRoute.get('/teacher/pending-grading', dashboardController.getTeacherPendingGrading);
dashboardRoute.get('/student/pending-items', dashboardController.getStudentPendingItems);
