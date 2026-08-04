import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { ExamRoom, Exam, Question, ExamQuestion } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch, params }) => {
	const { token, user } = await parent();
	const userId = user?.id;
	const examId = params.examId;

	const [exam, examRooms, allQuestions] = await Promise.all([
		api.safeGet<Exam>(fetch, `/exam/exams/${examId}`, null as unknown as Exam),
		api.safeGet<ExamRoom[]>(fetch, '/exam/exam-rooms', [], { examId, limit: 100 }),
		api.safeGet<Question[]>(fetch, '/exam/questions', [], {
			options: 'true',
			correctAnswer: 'true',
			limit: 1000
		})
	]);

	if (!exam || exam.questionCreatorId !== userId) throw redirect(302, '/supervisor/questions');

	const primaryRoom = examRooms[0] ?? null;
	const primaryRoomId = primaryRoom?.id ?? null;

	const allExamQuestions = primaryRoomId
		? await Promise.all(
				examRooms.map((er) =>
					api.safeGet<ExamQuestion[]>(fetch, '/exam/exam-questions', [], {
						examRoomId: er.id,
						limit: 200
					})
				)
			).then((results) => results.flat())
		: [];

	const examQuestionIdsByQuestion = new Map<string, string[]>();
	for (const eq of allExamQuestions) {
		const existing = examQuestionIdsByQuestion.get(eq.questionId) ?? [];
		examQuestionIdsByQuestion.set(eq.questionId, [...existing, eq.id]);
	}

	const questionMap = new Map(allQuestions.map((q) => [q.id, q]));
	const primaryRoomQuestions = allExamQuestions.filter((eq) => eq.examRoomId === primaryRoomId);
	const questions = primaryRoomQuestions
		.filter((eq) => questionMap.has(eq.questionId))
		.sort((a, b) => a.questionNumber - b.questionNumber)
		.map((eq) => ({
			...eq,
			question: questionMap.get(eq.questionId),
			allExamQuestionIds: examQuestionIdsByQuestion.get(eq.questionId) ?? [eq.id]
		}));

	const nextNumber =
		questions.length > 0 ? Math.max(...questions.map((q) => q.questionNumber)) + 1 : 1;

	return {
		view: 'detail' as const,
		examId,
		exam,
		examRoomIds: examRooms.map((er) => er.id),
		questions,
		nextNumber
	};
};
