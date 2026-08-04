import { Router } from 'express';
import { sentriAuth } from '#auth';

import { resolveProfile } from '../middleware/resolve-profile.js';

import { attachmentRoute } from '#learn/modules/attachment/index.js';
import { materialRoute } from '#learn/modules/material/index.js';
import { assignmentRoute } from '#learn/modules/assignment/index.js';
import { assignmentSubmissionRoute, directSubmissionRoute } from '#learn/modules/assignment-submission/index.js';
import { quizRoute } from '#learn/modules/quiz/index.js';
import { quizSubmissionRoute } from '#learn/modules/quiz-submission/index.js';
import { gradeRoute } from '#learn/modules/grade/index.js';
import { dashboardRoute } from '#learn/modules/dashboard/index.js';

export const learnRouter = Router();

// Public API
learnRouter.use('/attachments', attachmentRoute);

// Protect all remaining routes with Sentri JWT validation (client mode — fetches JWKS from Master API)
learnRouter.use(sentriAuth.protect());

// Resolve profileId dari master database berdasarkan auth user
learnRouter.use(resolveProfile);

// LMS Endpoints
learnRouter.use('/materials', materialRoute);
learnRouter.use('/assignments', assignmentRoute);
learnRouter.use('/assignments/:assignmentId/submissions', assignmentSubmissionRoute);
learnRouter.use('/assignment-submissions', directSubmissionRoute);
learnRouter.use('/quizzes', quizRoute);
learnRouter.use('/quizzes/:quizId/submissions', quizSubmissionRoute);
learnRouter.use('/grades', gradeRoute);
learnRouter.use('/dashboard', dashboardRoute);
