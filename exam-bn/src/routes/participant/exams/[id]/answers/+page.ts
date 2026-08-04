import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { ExamRoom, Exam, Question, ExamAnswer, EssayGrade, Room, ExamScore } from '$lib/types';

type ExamQuestionRaw = { questionId: string; questionNumber: number };

export const load: PageLoad = async ({ parent, fetch, params }) => {
	const { token, user } = await parent();
	const examRoomId = params.id;
	if (!examRoomId) throw redirect(302, '/participant');
	const userId = user?.id ?? '';

	const examRoom = await api.safeGet<ExamRoom>(
		fetch,
		`/exam/exam-rooms/${examRoomId}`,
		null as unknown as ExamRoom
	);

	const [exam, allQuestions, examQuestions, answers, grades, room, examScores] = await Promise.all([
		examRoom?.examId
			? api.safeGet<Exam>(fetch, `/exam/exams/${examRoom.examId}`, null as unknown as Exam)
			: Promise.resolve(null),
		api.safeGet<Question[]>(fetch, '/exam/questions', [], {
			allOptions: true,
			correctAnswer: true,
			limit: 1000
		}),
		api.safeGet<ExamQuestionRaw[]>(fetch, '/exam/exam-questions', [], { examRoomId, limit: 200 }),
		api.safeGet<ExamAnswer[]>(fetch, '/exam/exam-answers', [], { examRoomId, userId, limit: 200 }),
		api.safeGet<EssayGrade[]>(fetch, '/exam/essay-grades', [], { examRoomId, userId, limit: 200 }),
		examRoom?.roomId
			? api.safeGet<Room>(fetch, `/exam/rooms/${examRoom.roomId}`, null as unknown as Room)
			: Promise.resolve(null),
		api.safeGet<ExamScore[]>(fetch, '/exam/exam-scores', [], { examRoomId, userId, limit: 1 })
	]);

	const qMap = new Map(allQuestions.map((q) => [q.id, q]));
	const ansMap = new Map(answers.map((a) => [a.questionId, a]));
	const gradeMap = new Map(grades.map((g) => [g.questionId, g.points]));

	const questions = examQuestions
		.sort((a, b) => a.questionNumber - b.questionNumber)
		.map((eq) => {
			const q = qMap.get(eq.questionId);
			const ans = ansMap.get(eq.questionId);
			const participantOptionId = ans?.optionId ?? null;
			const aliveOptions = (q?.options ?? []).filter((o) => !o.deletedAt);
			const participantDeletedOption = participantOptionId
				? ((q?.options ?? []).find((o) => o.id === participantOptionId && !!o.deletedAt) ?? null)
				: null;
			return {
				number: eq.questionNumber,
				text: q?.text ?? '-',
				type: (q?.type ?? 'MULTIPLE_CHOICE') as 'MULTIPLE_CHOICE' | 'ESSAY',
				options: aliveOptions,
				participantDeletedOption: participantDeletedOption
					? { id: participantDeletedOption.id, text: participantDeletedOption.text }
					: null,
				correctOptionId: q?.correctAnswer?.optionId ?? null,
				participantOptionId,
				participantText: ans?.text ?? null,
				points: gradeMap.get(eq.questionId) ?? null
			};
		});

	return {
		examRoomId,
		examName: exam?.name ?? '-',
		roomName: room?.name ?? '-',
		mcWeight: exam?.mcWeight ?? null,
		essayWeight: exam?.essayWeight ?? null,
		passingGrade: exam?.passingGrade ?? 75,
		totalScore: examScores[0]?.score ?? null,
		questions
	};
};
