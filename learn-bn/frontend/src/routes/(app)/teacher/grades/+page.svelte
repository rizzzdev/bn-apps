<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';

	let teacherId = $derived(authState.user?.id || '');
	let teacherClasses = $derived(lmsStore.getClassesForTeacher(teacherId));

	let assignments = $derived(
		lmsStore.assignments.filter((a) => teacherClasses.some((c) => c.id === a.classId))
	);
	let quizzes = $derived(
		lmsStore.quizzes.filter((q) => teacherClasses.some((c) => c.id === q.classId))
	);

	let allSubmissions = $derived(
		lmsStore.assignmentSubmissions.filter((s) => assignments.find((a) => a.id === s.assignmentId))
	);
	let allQuizSubmissions = $derived(
		lmsStore.quizSubmissions.filter((s) => quizzes.find((q) => q.id === s.quizId))
	);

	function getStudentName(studentId: string) {
		return studentId === 's1' ? 'Andi (Murid)' : `Siswa ${studentId}`;
	}

	function getAssignmentName(assignmentId: string) {
		return lmsStore.assignments.find((a) => a.id === assignmentId)?.title || 'Unknown Assignment';
	}

	function getQuizName(quizId: string) {
		return lmsStore.quizzes.find((q) => q.id === quizId)?.title || 'Unknown Quiz';
	}

	function getClassName(classId: string) {
		return teacherClasses.find((c) => c.id === classId)?.name || 'Unknown Class';
	}
</script>

<div class="flex justify-between items-center mb-6 mt-4">
	<h3 class="font-headline-md text-2xl font-bold flex items-center gap-2">
		<span class="material-symbols-outlined text-3xl">grade</span>
		Rekap Nilai Keseluruhan
	</h3>
</div>

<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-12 text-center flex flex-col items-center">
	<span class="material-symbols-outlined text-6xl text-secondary mb-4">analytics</span>
	<p class="font-body-md text-lg text-secondary">Halaman rekap nilai komprehensif untuk semua tugas dan kuis (Masih dalam pengembangan).</p>
</article>
