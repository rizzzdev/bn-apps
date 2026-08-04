import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { ExamSupervisor, ExamRoom, Exam, Room, ExamScore } from '$lib/types';

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

	const examRoomIds = supervisors.map((s) => s.examRoomId);

	const [participantCounts, scoreCounts] = await Promise.all([
		Promise.all(
			examRoomIds.map((erId) =>
				api
					.safeGet<any[]>(fetch, '/exam-participants', [], { examRoomId: erId, limit: 500 })
					.then((ps) => ({ examRoomId: erId, total: ps.length }))
			)
		),
		Promise.all(
			examRoomIds.map((erId) =>
				api
					.safeGet<ExamScore[]>(fetch, '/exam-scores', [], { examRoomId: erId, limit: 500 })
					.then((ss) => ({ examRoomId: erId, submitted: ss.length }))
			)
		)
	]);

	const participantMap = new Map(participantCounts.map((p) => [p.examRoomId, p.total]));
	const scoreMap = new Map(scoreCounts.map((s) => [s.examRoomId, s.submitted]));

	const now = new Date();
	const myRooms = supervisors.map((s) => {
		const er = examRoomMap.get(s.examRoomId);
		const exam = er ? examMap.get(er.examId) : undefined;
		const room = er ? roomMap.get(er.roomId) : undefined;
		const totalParticipants = participantMap.get(s.examRoomId) ?? 0;
		const submittedCount = scoreMap.get(s.examRoomId) ?? 0;

		const status = !exam
			? 'unknown'
			: new Date(exam.endTime) < now
				? 'finished'
				: new Date(exam.startTime) <= now
					? 'active'
					: 'upcoming';

		return {
			...s,
			examRoom: er ? { ...er, exam, room } : undefined,
			totalParticipants,
			submittedCount,
			status
		};
	});

	const sortByExamCreatedAt = (a: (typeof myRooms)[0], b: (typeof myRooms)[0]) =>
		new Date(b.examRoom?.exam?.createdAt ?? 0).getTime() -
		new Date(a.examRoom?.exam?.createdAt ?? 0).getTime();

	const activeRooms = myRooms.filter((r) => r.status === 'active').sort(sortByExamCreatedAt);
	const upcomingRooms = myRooms.filter((r) => r.status === 'upcoming').sort(sortByExamCreatedAt);
	const finishedRooms = myRooms.filter((r) => r.status === 'finished').sort(sortByExamCreatedAt);

	return { myRooms, activeRooms, upcomingRooms, finishedRooms };
};
