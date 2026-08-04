import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { ExamParticipant, ExamRoom, Exam, Room, ExamScore } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token, user } = await parent();
	const userId = user?.id;

	const [participants, examRooms, exams, rooms] = await Promise.all([
		api.safeGet<ExamParticipant[]>(fetch, '/exam-participants', [], { userId, limit: 100 }),
		api.safeGet<ExamRoom[]>(fetch, '/exam-rooms', [], { limit: 100 }),
		api.safeGet<Exam[]>(fetch, '/exams', [], { limit: 100 }),
		api.safeGet<Room[]>(fetch, '/rooms', [], { limit: 100 })
	]);

	const examRoomMap = new Map(examRooms.map((er) => [er.id, er]));
	const examMap = new Map(exams.map((e) => [e.id, e]));
	const roomMap = new Map(rooms.map((r) => [r.id, r]));

	const examRoomIds = participants.map((p) => p.examRoomId);
	const scores = await Promise.all(
		examRoomIds.map((erId) =>
			api
				.safeGet<ExamScore[]>(fetch, '/exam-scores', [], { examRoomId: erId, userId, limit: 1 })
				.then((s) => ({ examRoomId: erId, score: s[0] ?? null }))
		)
	);
	const scoreMap = new Map(scores.map((s) => [s.examRoomId, s.score]));

	const now = new Date();
	const myExams = participants.map((p) => {
		const er = examRoomMap.get(p.examRoomId);
		const exam = er ? examMap.get(er.examId) : undefined;
		const room = er ? roomMap.get(er.roomId) : undefined;
		const scoreRecord = scoreMap.get(p.examRoomId);

		const status = !exam
			? 'unknown'
			: new Date(exam.endTime) < now
				? 'finished'
				: new Date(exam.startTime) <= now
					? 'active'
					: 'upcoming';

		return {
			...p,
			examRoom: er ? { ...er, exam, room } : undefined,
			score: scoreRecord?.score ?? null,
			submitted: !!scoreRecord,
			status
		};
	});

	const sortByExamCreatedAt = (a: (typeof myExams)[0], b: (typeof myExams)[0]) =>
		new Date(b.examRoom?.exam?.createdAt ?? 0).getTime() -
		new Date(a.examRoom?.exam?.createdAt ?? 0).getTime();

	const activeExams = myExams.filter((e) => e.status === 'active').sort(sortByExamCreatedAt);
	const upcomingExams = myExams.filter((e) => e.status === 'upcoming').sort(sortByExamCreatedAt);
	const finishedExams = myExams.filter((e) => e.status === 'finished').sort(sortByExamCreatedAt);

	const scores2 = finishedExams.map((e) => e.score).filter((s): s is number => s !== null);
	const avgScore =
		scores2.length > 0 ? Math.round(scores2.reduce((a, b) => a + b, 0) / scores2.length) : null;

	return { myExams, activeExams, upcomingExams, finishedExams, avgScore, token };
};
