import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { User, Exam, ExamRoom, ExamParticipant, ExamScore } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token } = await parent();

	const [exams, allExamRooms, allUsers] = await Promise.all([
		api.safeGet<Exam[]>(fetch, '/exams', [], { limit: 1000 }),
		api.safeGet<ExamRoom[]>(fetch, '/exam-rooms', [], { limit: 1000 }),
		api.safeGet<User[]>(fetch, '/users', [], { limit: 1000 })
	]);

	const roomData = await Promise.all(
		allExamRooms.map(async (er) => {
			const [participants, scores] = await Promise.all([
				api.safeGet<ExamParticipant[]>(fetch, '/exam-participants', [], {
					examRoomId: er.id,
					limit: 500
				}),
				api.safeGet<ExamScore[]>(fetch, '/exam-scores', [], { examRoomId: er.id, limit: 500 })
			]);
			return { examRoomId: er.id, examId: er.examId, participants, scores };
		})
	);

	const userMap = new Map(allUsers.map((u) => [u.id, u]));

	const examResults = exams
		.map((exam) => {
			const roomsForExam = roomData.filter((d) => d.examId === exam.id);
			const participantMap = new Map<
				string,
				{
					userId: string;
					fullname: string;
					username: string;
					score: number | null;
					submitted: boolean;
					examRoomId: string;
				}
			>();

			for (const rd of roomsForExam) {
				const scoreMap = new Map(
					(rd.scores as ExamScore[]).map((s) => [s.userId, s.score ?? null])
				);
				for (const p of rd.participants as ExamParticipant[]) {
					if (!participantMap.has(p.userId)) {
						participantMap.set(p.userId, {
							userId: p.userId,
							fullname: userMap.get(p.userId)?.fullname ?? p.userId,
							username: userMap.get(p.userId)?.username ?? p.userId,
							score: scoreMap.has(p.userId) ? (scoreMap.get(p.userId) ?? null) : null,
							submitted: scoreMap.has(p.userId),
							examRoomId: rd.examRoomId
						});
					}
				}
			}

			return {
				examId: exam.id,
				examName: exam.name,
				startTime: exam.startTime,
				endTime: exam.endTime,
				passingGrade: exam.passingGrade ?? 75,
				participants: Array.from(participantMap.values())
			};
		})
		.filter((e) => e.participants.length > 0);

	examResults.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

	return { examResults, token };
};
