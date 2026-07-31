import { Router } from 'express';
import { assignmentSubmissionController } from '../controller/assignment-submission.controller';

export const assignmentSubmissionRoute = Router({ mergeParams: true });

// Mounted at: /api/v1/assignments/:assignmentId/submissions
assignmentSubmissionRoute.post('/', assignmentSubmissionController.submit);
assignmentSubmissionRoute.get('/my', assignmentSubmissionController.getMySubmission);
assignmentSubmissionRoute.get('/', assignmentSubmissionController.getAllSubmissions);

// Note: grade endpoint will be mounted differently since it doesn't need assignmentId if we have submissionId.
// Or we can just mount it here as well for simplicity.
// Let's create a separate router for direct submission access without assignmentId
export const directSubmissionRoute = Router();
directSubmissionRoute.put('/:submissionId/grade', assignmentSubmissionController.gradeSubmission);
directSubmissionRoute.post('/bulk-grade', assignmentSubmissionController.bulkGrade);
