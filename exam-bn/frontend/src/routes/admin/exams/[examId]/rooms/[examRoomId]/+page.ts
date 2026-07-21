import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { Exam, ExamRoom, Room } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch, params }) => {
	const { token } = await parent();
	const examRoomId = params.examRoomId;

	type ExamLog = { id: string; type: string; message: string; createdAt: string };
	const [examRoom, exams, rooms, examStatus, examLogs, initialStatuses] = await Promise.all([
		api.safeGet<ExamRoom>(fetch, `/exam-rooms/${examRoomId}`, null as unknown as ExamRoom),
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
		throw redirect(302, '/admin/exams');
	}

	const examMap = new Map(exams.map((e) => [e.id, e]));
	const roomMap = new Map(rooms.map((r) => [r.id, r]));

	return {
		examRoomId,
		examRoom: {
			...examRoom,
			exam: examMap.get(examRoom.examId),
			room: roomMap.get(examRoom.roomId)
		},
		examStarted: examStatus.started,
		startedAt: examStatus.startedAt,
		examStatus: examStatus.status as 'PENDING' | 'ONGOING' | 'ENDED',
		token,
		initialLogs: examLogs,
		initialStatuses
	};
};
