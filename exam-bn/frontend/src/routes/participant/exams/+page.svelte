<script lang="ts">
	import { onMount } from 'svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import type { PageData } from './$types';
	import { examStatus } from '$lib/state/examStatus.svelte';

	let { data }: { data: PageData } = $props();

	const WIB: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta' };

	let page = $state(1);
	const PAGE_SIZE = 10;
	const paginatedExams = $derived(
		(data.myExams as any[]).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
	);

	function getOriginalStatus(exam: { startTime: string; endTime: string } | undefined) {
		if (!exam) return 'upcoming';
		const now = new Date();
		if (new Date(exam.endTime) < now) return 'finished';
		if (new Date(exam.startTime) <= now) return 'active';
		return 'upcoming';
	}

	onMount(() => {
		examStatus.init(data.token, data.myExams as any);
	});
</script>

<svelte:head>
	<title>Daftar Ujian - Exam-BN</title>
</svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-black text-(--text-primary)">Ujian Saya</h1>
	<p class="mt-1 text-sm font-medium text-(--text-secondary)">
		Pilih ujian yang tersedia untuk mulai mengerjakan.
	</p>
</div>

{#if (data.myExams as any[]).length === 0}
	<div class="card p-8 text-center font-bold text-(--text-secondary)">
		Belum ada ujian yang ditugaskan untuk Anda.
	</div>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each paginatedExams as p (p.id)}
			{@const exam = p.examRoom?.exam}
			{@const room = p.examRoom?.room}
			{@const status = examStatus.getStatus(p.examRoomId, getOriginalStatus(exam))}
			<div class="card flex flex-col overflow-hidden">
				<div class="card-header flex justify-between items-center">
					<h3 class="text-base font-black text-(--text-primary) truncate">{exam?.name ?? '-'}</h3>
					{#if status === 'active'}
						<Badge variant="success" class="animate-pulse">Tersedia</Badge>
					{:else if status === 'upcoming'}
						<Badge>Akan Datang</Badge>
					{:else}
						<Badge variant="danger">Selesai</Badge>
					{/if}
				</div>
				<div class="p-5 flex-1 flex flex-col justify-between">
					<dl class="space-y-2 text-sm font-medium text-(--text-secondary) mb-5">
						{#if room}
							<div class="flex items-center gap-2">
								<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
									/>
								</svg>
								<dd class="font-black text-(--text-primary)">{room.name}</dd>
							</div>
						{/if}
						{#if exam}
							<div class="flex items-center gap-2">
								<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<dd>
									{new Date(exam.startTime).toLocaleString('id-ID', WIB)} &ndash; {new Date(
										exam.endTime
									).toLocaleString('id-ID', WIB)}
								</dd>
							</div>
						{/if}
					</dl>
					{#if status === 'active'}
						<a href="/participant/exams/{p.examRoomId}" class="btn-primary w-full text-center"
							>Masuk Ruangan</a
						>
					{:else if status === 'upcoming'}
						<button disabled class="btn-secondary w-full text-center">Belum Dimulai</button>
					{:else}
						{#if p.submitted}
							<div class="text-center py-2 mb-3">
								{#if p.score !== null}
									<p class="text-xs font-medium text-(--text-secondary) mb-1">Nilai Anda</p>
									<p
										class="text-3xl font-black {p.score >= 75
											? 'text-green-600'
											: p.score >= 50
												? 'text-yellow-600'
												: 'text-red-600'}"
									>
										{p.score}
									</p>
								{:else}
									<p class="text-sm font-medium text-(--text-secondary) italic">Belum Dinilai</p>
								{/if}
							</div>
							<a
								href="/participant/exams/{p.examRoomId}/answers"
								class="btn-secondary w-full text-center block mb-2">Lihat Jawaban</a
							>
						{/if}
						<button disabled class="btn-secondary w-full text-center">Ujian Selesai</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
	<Pagination bind:page total={(data.myExams as any[]).length} pageSize={PAGE_SIZE} />
{/if}
