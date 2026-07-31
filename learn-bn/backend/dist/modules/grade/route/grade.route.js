import { Router } from 'express';
import { gradeController } from '../controller/grade.controller';
export const gradeRoute = Router({ mergeParams: true });
// Mounted at: /api/v1/grades
gradeRoute.get('/class/:classId/my', gradeController.getMyGrades);
gradeRoute.get('/class/:classId', gradeController.getClassGrades);
