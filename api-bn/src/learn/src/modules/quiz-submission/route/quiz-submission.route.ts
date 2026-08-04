import { Router } from 'express';
import { quizSubmissionController } from '../controller/quiz-submission.controller';

export const quizSubmissionRoute = Router({ mergeParams: true });

// Mounted at: /api/v1/quizzes/:quizId/submissions
quizSubmissionRoute.post('/start', quizSubmissionController.startQuiz);
quizSubmissionRoute.post('/finish', quizSubmissionController.finishQuiz);
quizSubmissionRoute.get('/my', quizSubmissionController.getMySubmission);
quizSubmissionRoute.get('/', quizSubmissionController.getAllSubmissions);
