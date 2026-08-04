import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { Exam, ExamRoom, ExamParticipant, ExamScore, User } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token, user } = await parent();
	const userId = user?.id ?? '';

	const [exams, allExamRooms, allUsers] = await Promise.all([
		api.safeGet<Exam[]>(fetch, '/exam/exams', [], { questionCreatorId: userId, limit: 100 }),
		api.safeGet<ExamRoom[]>(fetch, '/exam/exam-rooms', [], { limit: 1000 }),
		api.safeGet<User[]>(fetch, '/exam/users', [], { limit: 1000 })
	]);

	const myExamIds = new Set(exams.map((e) => e.id));
	const myExamRooms = allExamRooms.filter((er) => myExamIds.has(er.examId));

	const roomData = await Promise.all(
		myExamRooms.map(async (er) => {
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
			const allParticipants = new Set<string>();

			for (const rd of roomsForExam) {
				for (const p of rd.participants as ExamParticipant[]) allParticipants.add(p.userId);
				for (const s of rd.scores as ExamScore[]) {
					if (!scoreMap.has(s.userId)) scoreMap.set(s.userId, s.score ?? null);
				}
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

			const avg =
				scored.length > 0
					? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10
					: null;
			const min = scored.length > 0 ? Math.min(...scored) : null;
			const max = scored.length > 0 ? Math.max(...scored) : null;

			const buckets = Array.from({ length: 10 }, (_, i) => ({
				label: `${i * 10}–${i === 9 ? 100 : i * 10 + 9}`,
				count: 0
			}));
			for (const s of scored) {
				buckets[Math.min(Math.floor(s / 10), 9)].count++;
			}

			// Per-participant rows for export
			const participantRows = [...allParticipants].map((uid, i) => {
				const u = userMap.get(uid);
				const score = scoreMap.has(uid) ? (scoreMap.get(uid) ?? null) : undefined;
				return {
					no: i + 1,
					fullname: u?.fullname ?? uid,
					email: u?.email ?? uid,
					score: score !== undefined ? (score !== null ? score : 'Belum dinilai') : 'Tidak hadir',
					status:
						score !== undefined
							? score !== null
								? score >= passingGrade
									? 'Lulus'
									: 'Tidak Lulus'
								: 'Belum dinilai'
							: 'Tidak hadir'
				};
			});

			return {
				examId: exam.id,
				examName: exam.name,
				startTime: exam.startTime,
				endTime: exam.endTime,
				passingGrade,
				mcWeight: exam.mcWeight ?? 1,
				essayWeight: exam.essayWeight ?? 0,
				totalParticipants: allParticipants.size,
				submitted: submitted.length,
				scored: scored.length,
				notSubmitted,
				pendingGrade,
				passed,
				failed,
				failedTotal,
				avg,
				min,
				max,
				buckets,
				participantRows
			};
		})
		.filter((e) => e.totalParticipants > 0);

	examStats.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

	return { examStats };
};
