import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { ExamSupervisor, ExamRoom, Exam, Room } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token, user } = await parent();
	const userId = user?.id;

	const [supervisors, examRooms, exams, rooms] = await Promise.all([
		api.safeGet<ExamSupervisor[]>(fetch, '/exam-supervisors', [], { userId, limit: 100 }),
		api.safeGet<ExamRoom[]>(fetch, '/exam-rooms', [], { limit: 100 }),
		api.safeGet<Exam[]>(fetch, '/exams', [], { limit: 100 }),
		api.safeGet<Room[]>(fetch, '/rooms', [], { limit: 100 })
	]);

	const examRoomMap = new Map(examRooms.map((er) => [er.id, er]));
	const examMap = new Map(exams.map((e) => [e.id, e]));
	const roomMap = new Map(rooms.map((r) => [r.id, r]));

	const myRooms = supervisors
		.map((s) => {
			const er = examRoomMap.get(s.examRoomId);
			const exam = er ? examMap.get(er.examId) : undefined;
			const room = er ? roomMap.get(er.roomId) : undefined;
			return { ...s, examRoom: er ? { ...er, exam, room } : undefined };
		})
		.sort(
			(a, b) =>
				new Date(b.examRoom?.exam?.createdAt ?? 0).getTime() -
				new Date(a.examRoom?.exam?.createdAt ?? 0).getTime()
		);

	return { view: 'list' as const, myRooms, token };
};
