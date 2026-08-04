import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { ExamQuestion, Question, ExamAnswer } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch, params }) => {
	const { token } = await parent();
	const participantId = params.participantId;
	const examRoomId = params.examRoomId;

	if (!participantId || !examRoomId) {
		throw redirect(302, `/supervisor/rooms`);
	}

	const [examQuestions, existingAnswers] = await Promise.all([
		api.safeGet<ExamQuestion[]>(fetch, '/exam-questions', [], { examRoomId, limit: 300 }),
		api.safeGet<ExamAnswer[]>(fetch, '/exam-answers', [], {
			examRoomId,
			userId: participantId,
			limit: 300
		})
	]);

	const questions = examQuestions.sort((a, b) => a.questionNumber - b.questionNumber);

	return {
		token,
		participantId,
		examRoomId,
		questions,
		initialAnswers: existingAnswers
	};
};
