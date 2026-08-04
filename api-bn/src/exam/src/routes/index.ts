import { Router } from 'express';
import { sentriAuth } from '#auth';
import { sendResponse } from '#app';

import { resolveProfile } from '../middleware/resolve-profile.js';
import { asyncHandler } from '#exam/utils/asyncHandler.js';
import { userDirectoryService } from '#exam/modules/user-directory/user-directory.service.js';
import userDirectoryRouter from '#exam/modules/user-directory/user-directory.route.js';

import roomRouter from '#exam/modules/room/room.routes.js';
import examModuleRouter from '#exam/modules/exam/exam.routes.js';
import examRoomRouter from '#exam/modules/exam-room/exam-room.routes.js';
import examParticipantRouter from '#exam/modules/exam-participant/exam-participant.routes.js';
import examSupervisorRouter from '#exam/modules/exam-supervisor/exam-supervisor.routes.js';
import questionRouter from '#exam/modules/question/question.routes.js';
import optionRouter from '#exam/modules/option/option.routes.js';
import questionCorrectAnswerRouter from '#exam/modules/question-correct-answer/question-correct-answer.routes.js';
import examQuestionRouter from '#exam/modules/exam-question/exam-question.routes.js';
import examAnswerRouter from '#exam/modules/exam-answer/exam-answer.routes.js';
import examScoreRouter from '#exam/modules/exam-score/exam-score.routes.js';
import examSessionRouter from '#exam/modules/exam-session/exam-session.routes.js';
import examLogRouter from '#exam/modules/exam-log/exam-log.routes.js';
import essayGradeRouter from '#exam/modules/essay-grade/essay-grade.routes.js';
import chatRouter from '#exam/modules/chat/chat.routes.js';
import notificationRouter from '#exam/modules/notification/notification.routes.js';
import classDirectoryRouter from '#exam/modules/class-directory/class-directory.route.js';

export const examRouter = Router();

// Protect all routes with Sentri JWT validation
examRouter.use(sentriAuth.protect());

// Resolve profileId dari master database berdasarkan auth user
examRouter.use(resolveProfile);

// Profil user saat ini (shape exam: id, fullname, email, role)
examRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await userDirectoryService.me(req.user!.id, req.user?.roles ?? []);
    sendResponse(res, 200, 'OK', user);
  }),
);

// Direktori user read-only (list + filter role) — kelola akun di master/portal
examRouter.use('/users', userDirectoryRouter);
examRouter.use('/classes', classDirectoryRouter);

// Exam Endpoints
examRouter.use('/rooms', roomRouter);
examRouter.use('/exams', examModuleRouter);
examRouter.use('/exam-rooms', examRoomRouter);
examRouter.use('/exam-participants', examParticipantRouter);
examRouter.use('/exam-supervisors', examSupervisorRouter);
examRouter.use('/questions', questionRouter);
examRouter.use('/options', optionRouter);
examRouter.use('/question-correct-answers', questionCorrectAnswerRouter);
examRouter.use('/exam-questions', examQuestionRouter);
examRouter.use('/exam-answers', examAnswerRouter);
examRouter.use('/exam-scores', examScoreRouter);
examRouter.use('/exam-sessions', examSessionRouter);
examRouter.use('/exam-logs', examLogRouter);
examRouter.use('/essay-grades', essayGradeRouter);
examRouter.use('/chats', chatRouter);
examRouter.use('/notifications', notificationRouter);
