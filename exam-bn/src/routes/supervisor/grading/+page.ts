import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { Exam, ExamRoom, Room } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token, user } = await parent();
	const userId = user?.id ?? '';

	const [exams, allExamRooms, allRooms] = await Promise.all([
		api.safeGet<Exam[]>(fetch, '/exam/exams', [], { questionCreatorId: userId, limit: 100 }),
		api.safeGet<ExamRoom[]>(fetch, '/exam/exam-rooms', [], { limit: 1000 }),
		api.safeGet<Room[]>(fetch, '/exam/rooms', [], { limit: 100 })
	]);

	const myExamIds = new Set(exams.map((e) => e.id));
	const roomMap = new Map(allRooms.map((r) => [r.id, r]));
	const examMap = new Map(exams.map((e) => [e.id, e]));

	return {
		myExamRooms: allExamRooms
			.filter((er) => myExamIds.has(er.examId))
			.map((er) => ({ ...er, exam: examMap.get(er.examId), room: roomMap.get(er.roomId) }))
	};
};
