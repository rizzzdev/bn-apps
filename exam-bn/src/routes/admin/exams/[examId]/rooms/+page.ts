import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { Exam, ExamRoom, Room, RoomAvailability } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch, params }) => {
	const { token } = await parent();
	const examId = params.examId;

	if (!examId) {
		throw redirect(302, '/admin/exams');
	}

	const [exam, examRooms, rooms, availability] = await Promise.all([
		api.safeGet<Exam>(fetch, `/exams/${examId}`, null as unknown as Exam),
		api.safeGet<ExamRoom[]>(fetch, '/exam-rooms', [], { examId, limit: 100 }),
		api.safeGet<Room[]>(fetch, '/rooms', [], { limit: 100 }),
		api.safeGet<RoomAvailability[]>(fetch, '/exam-rooms/availability', [], { examId })
	]);

	if (!exam) {
		throw redirect(302, '/admin/exams');
	}

	const roomMap = new Map(rooms.map((r) => [r.id, r]));
	const availabilityMap = new Map(availability.map((a) => [a.roomId, a]));
	return {
		examId,
		exam,
		examRooms: examRooms.map((er) => ({ ...er, room: roomMap.get(er.roomId) })),
		rooms: rooms.map((r) => ({ ...r, availability: availabilityMap.get(r.id) })),
		token
	};
};
