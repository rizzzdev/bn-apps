import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { Exam, ExamRoom, Room } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token, user } = await parent();
	const userId = user?.id;

	const [exams, examRooms, rooms] = await Promise.all([
		api.safeGet<Exam[]>(fetch, '/exam/exams', [], { questionCreatorId: userId, limit: 100 }),
		api.safeGet<ExamRoom[]>(fetch, '/exam/exam-rooms', [], { limit: 1000 }),
		api.safeGet<Room[]>(fetch, '/exam/rooms', [], { limit: 100 })
	]);

	const examRoomMap = new Map<string, ExamRoom[]>();
	examRooms.forEach((er) => {
		if (!examRoomMap.has(er.examId)) examRoomMap.set(er.examId, []);
		examRoomMap.get(er.examId)!.push(er);
	});
	const roomMap = new Map(rooms.map((r) => [r.id, r]));

	return {
		view: 'list' as const,
		myExams: exams.map((e) => ({
			...e,
			examRooms: (examRoomMap.get(e.id) ?? []).map((er: ExamRoom) => ({
				...er,
				room: roomMap.get(er.roomId)
			}))
		}))
	};
};
