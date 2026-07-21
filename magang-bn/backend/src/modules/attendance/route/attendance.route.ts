import { Router } from 'express';
import { attendanceController } from '../controller/index.js';
import { validate } from '@/middlewares/index.js';
import { createAttendanceSchema } from '../domain/schemas.js';

export const attendanceRoute = Router();

attendanceRoute.post('/', validate(createAttendanceSchema), attendanceController.create);
attendanceRoute.get('/', attendanceController.getAll);
attendanceRoute.get('/:id', attendanceController.getById);
