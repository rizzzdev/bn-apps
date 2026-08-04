import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type {
	ExamRoom,
	ExamParticipant,
	ExamQuestion,
	Question,
	ExamAnswer,
	Exam,
	Room
} from '$lib/types';

export const load: PageLoad = async ({ parent, fetch, params }) => {
	const { token, user } = await parent();
	const examRoomId = params.id;

	const userId = user?.id ?? '';

	const [participants, examRoom, examQuestions, existingAnswers, examStatus, submitStatus] =
		await Promise.all([
			api.safeGet<ExamParticipant[]>(fetch, '/exam/exam-participants', [], {
				examRoomId,
				userId,
				limit: 10
			}),
			api.safeGet<ExamRoom>(fetch, `/exam/exam-rooms/${examRoomId}`, null as unknown as ExamRoom),
			api.safeGet<ExamQuestion[]>(fetch, '/exam/exam-questions', [], { examRoomId, limit: 300 }),
			api.safeGet<ExamAnswer[]>(fetch, '/exam/exam-answers', [], {
				examRoomId,
				userId,
				limit: 300
			}),
			api.safeGet<{ started: boolean; startedAt: string | null }>(
				fetch,
				`/exam/exam-rooms/${examRoomId}/status`,
				{ started: false, startedAt: null }
			),
			api.safeGet<{ submitted: boolean }>(
				fetch,
				`/exam/exam-rooms/${examRoomId}/submit-status`,
				{ submitted: false },
				{ userId }
			)
		]);

	const isParticipant = participants.some((p) => p.userId === userId);
	if (!isParticipant) throw redirect(302, '/participant/exams');

	const [exam, room] = examRoom
		? await Promise.all([
				api.safeGet<Exam>(fetch, `/exam/exams/${examRoom.examId}`, null as unknown as Exam),
				api.safeGet<Room>(fetch, `/exam/rooms/${examRoom.roomId}`, null as unknown as Room)
			])
		: [null, null];

	const enrichedExamRoom = examRoom ? { ...examRoom, exam, room } : null;

	const questions = examQuestions.sort((a, b) => a.questionNumber - b.questionNumber);

	const answers: Record<string, { id: string; optionId?: string | null; text?: string | null }> =
		{};
	for (const a of existingAnswers) {
		answers[a.questionId] = { id: a.id, optionId: a.optionId, text: a.text };
	}

	const endTime = enrichedExamRoom?.exam?.endTime;
	const examExpiredInit = endTime ? new Date(endTime) < new Date() : false;

	return {
		mode: 'exam' as const,
		examRoomId,
		examRoom: enrichedExamRoom,
		questions,
		answers,
		token,
		userId,
		examStarted: examStatus.started,
		startedAt: examStatus.startedAt,
		alreadySubmitted: submitStatus.submitted,
		examExpiredInit
	};
};
