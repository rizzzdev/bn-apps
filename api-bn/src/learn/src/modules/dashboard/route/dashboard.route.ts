import { Router } from 'express';
import { dashboardController } from '../controller/dashboard.controller';

export const dashboardRoute = Router();

dashboardRoute.get('/teacher/pending-grading', dashboardController.getTeacherPendingGrading);
dashboardRoute.get('/student/pending-items', dashboardController.getStudentPendingItems);

dashboardRoute.get('/curriculum/overview', dashboardController.getCurriculumOverview);
dashboardRoute.get('/curriculum/teachers', dashboardController.getCurriculumTeachers);
dashboardRoute.get('/curriculum/students/at-risk', dashboardController.getCurriculumStudentsAtRisk);
dashboardRoute.get('/curriculum/classes', dashboardController.getCurriculumClasses);
