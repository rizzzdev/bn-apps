import { Router } from 'express';
import { assignmentSubmissionController } from '../controller/assignment-submission.controller';

export const assignmentSubmissionRoute = Router({ mergeParams: true });

// Mounted at: /api/v1/assignments/:assignmentId/submissions
assignmentSubmissionRoute.post('/', assignmentSubmissionController.submit);
assignmentSubmissionRoute.get('/my', assignmentSubmissionController.getMySubmission);
assignmentSubmissionRoute.get('/', assignmentSubmissionController.getAllSubmissions);

// Separate router untuk akses langsung tanpa assignmentId
export const directSubmissionRoute = Router();
directSubmissionRoute.put('/:submissionId/grade', assignmentSubmissionController.gradeSubmission);
directSubmissionRoute.post('/batch/grade', assignmentSubmissionController.bulkGrade);
