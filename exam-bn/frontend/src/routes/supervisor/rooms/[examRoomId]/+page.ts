import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { ExamSupervisor, ExamRoom, Exam, Room } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch, params }) => {
	const { token, user } = await parent();
	const userId = user?.id;
	const examRoomId = params.examRoomId;

	type ExamLog = { id: string; type: string; message: string; createdAt: string };
	const [examRoom, supervisors, exams, rooms, examStatus, examLogs, initialStatuses] =
		await Promise.all([
			api.safeGet<ExamRoom>(fetch, `/exam-rooms/${examRoomId}`, null as unknown as ExamRoom),
			api.safeGet<ExamSupervisor[]>(fetch, '/exam-supervisors', [], { examRoomId, limit: 100 }),
			api.safeGet<Exam[]>(fetch, '/exams', [], { limit: 100 }),
			api.safeGet<Room[]>(fetch, '/rooms', [], { limit: 100 }),
			api.safeGet<{ started: boolean; startedAt: string | null; status: string }>(
				fetch,
				`/exam-rooms/${examRoomId}/status`,
				{ started: false, startedAt: null, status: 'PENDING' }
			),
			api.safeGet<ExamLog[]>(fetch, '/exam-logs', [], { examRoomId, limit: 200 }),
			api.safeGet<any[]>(fetch, `/exam-rooms/${examRoomId}/participants-status`, [])
		]);

	if (!examRoom) {
		throw redirect(302, '/supervisor/rooms');
	}

	const examMap = new Map(exams.map((e) => [e.id, e]));
	const roomMap = new Map(rooms.map((r) => [r.id, r]));
	const isSupervisor = supervisors.some((s) => s.userId === userId);

	if (!isSupervisor) {
		throw redirect(302, '/supervisor/rooms');
	}

	return {
		view: 'detail' as const,
		examRoomId,
		examRoom: {
			...examRoom,
			exam: examMap.get(examRoom.examId),
			room: roomMap.get(examRoom.roomId)
		},
		isSupervisor,
		examStarted: examStatus.started,
		startedAt: examStatus.startedAt,
		examStatus: examStatus.status as 'PENDING' | 'ONGOING' | 'ENDED',
		token,
		initialLogs: examLogs,
		initialStatuses
	};
};
