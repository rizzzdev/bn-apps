import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { User, Exam, ExamRoom, ExamParticipant, ExamScore } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token } = await parent();

	const [exams, allExamRooms, allUsers] = await Promise.all([
		api.safeGet<Exam[]>(fetch, '/exam/exams', [], { limit: 1000 }),
		api.safeGet<ExamRoom[]>(fetch, '/exam/exam-rooms', [], { limit: 1000 }),
		api.safeGet<User[]>(fetch, '/exam/users', [], { limit: 1000 })
	]);

	const roomData = await Promise.all(
		allExamRooms.map(async (er) => {
			const [participants, scores] = await Promise.all([
				api.safeGet<ExamParticipant[]>(fetch, '/exam/exam-participants', [], {
					examRoomId: er.id,
					limit: 500
				}),
				api.safeGet<ExamScore[]>(fetch, '/exam/exam-scores', [], { examRoomId: er.id, limit: 500 })
			]);
			return { examRoomId: er.id, examId: er.examId, participants, scores };
		})
	);

	const userMap = new Map(allUsers.map((u) => [u.id, u]));

	const examStats = exams
		.map((exam) => {
			const roomsForExam = roomData.filter((d) => d.examId === exam.id);
			const scoreMap = new Map<string, number | null>();

			for (const rd of roomsForExam) {
				for (const s of rd.scores as ExamScore[]) {
					if (!scoreMap.has(s.userId)) scoreMap.set(s.userId, s.score ?? null);
				}
			}

			const allParticipants = new Set<string>();
			for (const rd of roomsForExam) {
				for (const p of rd.participants as ExamParticipant[]) allParticipants.add(p.userId);
			}

			const submitted = [...scoreMap.entries()];
			const scored = submitted.filter(([, s]) => s !== null).map(([, s]) => s!);

			const passingGrade = exam.passingGrade ?? 75;
			const passed = scored.filter((s) => s >= passingGrade).length;
			const failed = scored.filter((s) => s < passingGrade).length;
			const notSubmitted = allParticipants.size - submitted.length;
			// Anyone who didn't submit defaults to "tidak lulus" — never excluded
			// from the pass/fail tally just because they have no score yet.
			const failedTotal = failed + notSubmitted;
			const pendingGrade = submitted.filter(([, s]) => s === null).length;

			const avg = scored.length > 0 ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
			const min = scored.length > 0 ? Math.min(...scored) : null;
			const max = scored.length > 0 ? Math.max(...scored) : null;

			// Distribution buckets: 0-9, 10-19, ..., 90-100
			const buckets = Array.from({ length: 10 }, (_, i) => ({
				label: `${i * 10}–${i === 9 ? 100 : i * 10 + 9}`,
				count: 0
			}));
			for (const s of scored) {
				const idx = Math.min(Math.floor(s / 10), 9);
				buckets[idx].count++;
			}

			return {
				examId: exam.id,
				examName: exam.name,
				startTime: exam.startTime,
				endTime: exam.endTime,
				passingGrade,
				totalParticipants: allParticipants.size,
				submitted: submitted.length,
				scored: scored.length,
				notSubmitted,
				pendingGrade,
				passed,
				failed,
				failedTotal,
				avg: avg !== null ? Math.round(avg * 10) / 10 : null,
				min,
				max,
				buckets
			};
		})
		.filter((e) => e.totalParticipants > 0);

	examStats.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

	return { examStats };
};
