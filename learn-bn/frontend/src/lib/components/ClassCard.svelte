<script lang="ts">
	import Badge from './Badge.svelte';
	import Button from './Button.svelte';

	export interface ClassItem {
		id: string;
		name: string;
		majorId?: string;
		major?: { id: string; name: string } | null;
		studentCount?: number;
		subjectName?: string;
	}

	let {
		cls,
		href,
		actionText,
		role = 'student'
	}: {
		cls: ClassItem;
		href?: string;
		actionText?: string;
		role?: 'teacher' | 'student';
	} = $props();

	let majorName = $derived(cls.major?.name || 'Umum');
	let memberCount = $derived(cls.studentCount ?? 0);
	let targetHref = $derived(
		href || (role === 'teacher' ? `/teacher/classes/${cls.id}` : `/student/classes/${cls.id}`)
	);
	let buttonText = $derived(actionText || (role === 'teacher' ? 'Kelola Kelas' : 'Buka Kelas'));
</script>

<article
	class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex flex-col justify-between hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] transition-all duration-200 h-full"
>
	<div class="p-6 flex flex-col gap-3 flex-1">
		<div class="flex items-start justify-between gap-3">
			<div
				class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0"
			>
				<span class="material-symbols-outlined text-on-surface text-2xl">school</span>
			</div>
			<!-- Nama Jurusan dalam Badge -->
			<Badge variant="outline" class="uppercase text-[11px] font-bold">
				{majorName}
			</Badge>
		</div>

		<!-- Nama Kelas -->
		<div>
			<h4 class="font-headline-md text-xl font-black text-on-surface tracking-tight leading-snug">
				{cls.name}
			</h4>
			{#if cls.subjectName}
				<p class="font-body-md text-xs font-semibold text-secondary mt-0.5">{cls.subjectName}</p>
			{/if}
		</div>

		<!-- Jumlah Anggota -->
		<div class="mt-auto pt-2 flex items-center gap-2 text-sm font-label-bold text-secondary">
			<div
				class="w-7 h-7 bg-surface-container neo-border flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0"
			>
				<span class="material-symbols-outlined text-base text-on-surface">group</span>
			</div>
			<span>{memberCount} Anggota</span>
		</div>
	</div>

	<!-- Footer / Actions -->
	<div class="p-4 border-t-2 border-on-surface bg-[#E2E2E2] flex gap-2">
		<a href={targetHref} class="flex-1">
			<Button variant={role === 'teacher' ? 'primary' : 'secondary'} class="w-full justify-center">
				{buttonText}
			</Button>
		</a>
		{#if role === 'teacher'}
			<a href={`/teacher/assignments/new?classId=${cls.id}`} title="Buat Tugas Kelas Ini">
				<Button variant="outline">
					<span class="material-symbols-outlined text-sm">add_task</span>
				</Button>
			</a>
		{/if}
	</div>
</article>
