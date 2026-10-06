import type { Exam } from '$lib/types';

/**
 * Apakah guru ini termasuk pembuat soal ujian tsb?
 * - Ujian legacy (tanpa mapel) → true (soal "shared", semua guru dapat mengelola).
 * - Ujian dengan daftar guru pembuat soal (examTeachers) → hanya yang terdaftar.
 * - Ujian lama yang belum punya daftar → fallback: semua pengampu mapel (perilaku lama).
 */
export function isExamQuestionCreator(
	exam: Exam,
	userId: string,
	taughtSubjectIds: Set<string>
): boolean {
	if (!exam.subjectId) return true;
	const creators = exam.examTeachers ?? [];
	if (creators.length > 0) return creators.some((t) => t.teacherId === userId);
	return taughtSubjectIds.has(exam.subjectId);
}

/** Filter daftar ujian yang boleh dikelola soalnya oleh guru ini. */
export function filterCreatorExams(
	exams: Exam[],
	userId: string,
	taughtSubjectIds: Set<string>
): Exam[] {
	return exams.filter((e) => isExamQuestionCreator(e, userId, taughtSubjectIds));
}
