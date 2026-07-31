import { Router } from 'express';
import { quizController } from '../controller/quiz.controller';

export const quizRoute = Router();

// CRUD single
quizRoute.post('/', quizController.create);
quizRoute.get('/class/:classId', quizController.getByClass);
quizRoute.get('/:id', quizController.getById);
quizRoute.put('/:id', quizController.update);
quizRoute.delete('/:id', quizController.delete);

// Batch routes — distandardisasi
quizRoute.post('/batch', quizController.bulkCreate);
quizRoute.post('/batch/delete', quizController.bulkDelete);
