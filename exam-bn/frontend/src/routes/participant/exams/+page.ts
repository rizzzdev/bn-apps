import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { ExamRoom, ExamParticipant, Exam, Room, ExamScore } from '$lib/types';

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

	const myExams = participants
		.map((p) => {
			const er = examRoomMap.get(p.examRoomId);
			const exam = er ? examMap.get(er.examId) : undefined;
			const room = er ? roomMap.get(er.roomId) : undefined;
			const scoreRecord = scoreMap.get(p.examRoomId);
			return {
				...p,
				examRoom: er ? { ...er, exam, room } : undefined,
				score: scoreRecord?.score ?? null,
				submitted: !!scoreRecord
			};
		})
		.sort(
			(a, b) =>
				new Date(b.examRoom?.exam?.createdAt ?? 0).getTime() -
				new Date(a.examRoom?.exam?.createdAt ?? 0).getTime()
		);

	return {
		myExams,
		token,
		userId: userId ?? ''
	};
};
