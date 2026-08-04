import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type {
	Exam,
	ExamRoom,
	Room,
	ExamParticipant,
	ExamQuestion,
	Question,
	ExamAnswer,
	ExamScore,
	EssayGrade,
	User
} from '$lib/types';

export const load: PageLoad = async ({ parent, fetch, params }) => {
	const { token, user } = await parent();
	const userId = user?.id ?? '';
	const examRoomId = params.examRoomId;

	const [examRoom, exams, rooms] = await Promise.all([
		api.safeGet<ExamRoom>(fetch, `/exam/exam-rooms/${examRoomId}`, null as unknown as ExamRoom),
		api.safeGet<Exam[]>(fetch, '/exam/exams', [], { limit: 100 }),
		api.safeGet<Room[]>(fetch, '/exam/rooms', [], { limit: 100 })
	]);

	if (!examRoom) throw redirect(302, '/supervisor/grading');
	const exam = exams.find((e) => e.id === examRoom.examId);
	if (!exam || exam.questionCreatorId !== userId) throw redirect(302, '/supervisor/grading');

	const room = rooms.find((r) => r.id === examRoom.roomId);

	const [participants, allQuestions, examQuestions, scores, allUsers] = await Promise.all([
		api.safeGet<ExamParticipant[]>(fetch, '/exam/exam-participants', [], {
			examRoomId,
			limit: 500
		}),
		api.safeGet<Question[]>(fetch, '/exam/questions', [], { limit: 1000 }),
		api.safeGet<ExamQuestion[]>(fetch, '/exam/exam-questions', [], { examRoomId, limit: 200 }),
		api.safeGet<ExamScore[]>(fetch, '/exam/exam-scores', [], { examRoomId, limit: 500 }),
		api.safeGet<User[]>(fetch, '/exam/users', [], { limit: 1000 })
	]);

	const questionMap = new Map(allQuestions.map((q) => [q.id, q]));
	const essayExamQuestions = examQuestions
		.filter((eq) => questionMap.get(eq.questionId)?.type === 'ESSAY')
		.sort((a, b) => a.questionNumber - b.questionNumber)
		.map((eq) => ({ ...eq, question: questionMap.get(eq.questionId) }));

	const userMap = new Map(allUsers.map((u) => [u.id, u]));
	const scoreMap = new Map(scores.map((s) => [s.userId, s]));
	const submittedParticipants = participants.filter((p) => scoreMap.has(p.userId));

	const participantData = (
		await Promise.all(
			submittedParticipants.map(async (p) => {
				const [answers, grades] = await Promise.all([
					api.safeGet<ExamAnswer[]>(fetch, '/exam/exam-answers', [], {
						examRoomId,
						userId: p.userId,
						limit: 200
					}),
					api.safeGet<EssayGrade[]>(fetch, '/exam/essay-grades', [], {
						examRoomId,
						userId: p.userId,
						limit: 200
					})
				]);
				return {
					userId: p.userId,
					fullname: userMap.get(p.userId)?.fullname ?? p.userId,
					email: userMap.get(p.userId)?.email ?? p.userId,
					score: scoreMap.get(p.userId)?.score ?? null,
					answers: answers as ExamAnswer[],
					grades: Object.fromEntries((grades as EssayGrade[]).map((g) => [g.questionId, g]))
				};
			})
		)
	).filter((p) => p.answers.length > 0);

	return {
		examRoomId,
		examRoom: { ...examRoom, exam, room },
		essayQuestions: essayExamQuestions,
		participantData,
		mcWeight: exam.mcWeight ?? null,
		essayWeight: exam.essayWeight ?? null
	};
};
