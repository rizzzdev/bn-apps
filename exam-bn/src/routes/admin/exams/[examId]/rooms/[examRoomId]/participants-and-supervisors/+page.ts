import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type {
	Exam,
	ExamRoom,
	ExamParticipant,
	ExamSupervisor,
	User,
	Room,
	RoomAvailability
} from '$lib/types';

export const load: PageLoad = async ({ parent, fetch, params }) => {
	const { token } = await parent();
	const examRoomId = params.examRoomId;

	if (!examRoomId) {
		throw redirect(302, '/admin/exams');
	}

	const examRoom = await api.safeGet<ExamRoom>(
		fetch,
		`/exam/exam-rooms/${examRoomId}`,
		null as unknown as ExamRoom
	);
	if (!examRoom) {
		throw redirect(302, `/admin/exams`);
	}

	const examId = examRoom.examId;

	const [
		allParticipants,
		allSupervisors,
		allUsers,
		classes,
		exams,
		rooms,
		busyParticipantIds,
		busySupervisorIds,
		availability
	] = await Promise.all([
		api.safeGet<ExamParticipant[]>(fetch, '/exam/exam-participants', [], {
			examRoomId,
			limit: 1000
		}),
		api.safeGet<ExamSupervisor[]>(fetch, '/exam/exam-supervisors', [], { examRoomId, limit: 100 }),
		api.safeGet<User[]>(fetch, '/exam/users', [], { limit: 1000, examRoomId }),
		api.safeGet<any[]>(fetch, '/exam/classes', []),
		api.safeGet<Exam[]>(fetch, '/exam/exams', [], { limit: 100 }),
		api.safeGet<Room[]>(fetch, '/exam/rooms', [], { limit: 100 }),
		api.safeGet<string[]>(fetch, '/exam/exam-participants/busy-user-ids', [], { examRoomId }),
		api.safeGet<string[]>(fetch, '/exam/exam-supervisors/busy-user-ids', [], { examRoomId }),
		api.safeGet<RoomAvailability[]>(fetch, '/exam/exam-rooms/availability', [], { examId })
	]);

	const examMap = new Map(exams.map((e) => [e.id, e]));
	const roomMap = new Map(rooms.map((r) => [r.id, r]));
	const classMap = new Map(classes.map((c) => [c.id, c]));
	const enrichedRoom = {
		...examRoom,
		exam: examMap.get(examRoom.examId),
		room: roomMap.get(examRoom.roomId),
		classes: (examRoom.examRoomClasses ?? []).map((erc: any) => classMap.get(erc.classId)).filter(Boolean)
	};
	const userMap = new Map(allUsers.map((u) => [u.id, u]));
	const participantIds = new Set(allParticipants.map((p) => p.userId));
	const roomMonitorIds = new Set(allSupervisors.map((s) => s.userId));
	const busyParticipantIdSet = new Set(busyParticipantIds);
	const busySupervisorIdSet = new Set(busySupervisorIds);
	const roomAvailability = availability.find((a) => a.roomId === examRoom.roomId) ?? null;

	return {
		examId: examRoom.examId,
		examRoomId,
		examRoom: enrichedRoom,
		roomAvailability,
		classes,
		participants: allParticipants.map((p) => ({ ...p, user: userMap.get(p.userId) })),
		roomMonitors: allSupervisors.map((s) => ({ ...s, user: userMap.get(s.userId) })),
		availableParticipants: allUsers.filter(
			(u) =>
				u.role === 'student' && !participantIds.has(u.id) && !busyParticipantIdSet.has(u.id)
		),
		availableSupervisors: allUsers.filter(
			(u) => u.role === 'teacher' && !roomMonitorIds.has(u.id) && !busySupervisorIdSet.has(u.id)
		)
	};
};
