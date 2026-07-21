<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import ExamStatusCard from '$lib/components/ExamStatusCard.svelte';
	import { examStatus } from '$lib/state/examStatus.svelte';

	let { data }: { data: PageData } = $props();

	const WIB: Intl.DateTimeFormatOptions = {
		timeZone: 'Asia/Jakarta',
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	};

	onMount(() => {
		examStatus.init(data.token, data.myExams as any);
	});

	function getOriginalStatus(p: any) {
		if (data.activeExams.some((x) => x.id === p.id)) return 'active';
		if (data.finishedExams.some((x) => x.id === p.id)) return 'finished';
		return 'upcoming';
	}

	const activeExams = $derived(
		data.myExams.filter(
			(p) => examStatus.getStatus(p.examRoomId, getOriginalStatus(p)) === 'active'
		)
	);
	const upcomingExams = $derived(
		data.myExams.filter(
			(p) => examStatus.getStatus(p.examRoomId, getOriginalStatus(p)) === 'upcoming'
		)
	);
	const finishedExams = $derived(
		data.myExams.filter(
			(p) => examStatus.getStatus(p.examRoomId, getOriginalStatus(p)) === 'finished'
		)
	);
</script>

<div class="mb-6">
	<h1 class="text-2xl font-black text-(--text-primary)">Dashboard Peserta</h1>
	<p class="text-sm font-medium text-(--text-secondary) mt-1">Ringkasan ujian Anda.</p>
</div>

<!-- Stats -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
	<div class="card p-5 text-center">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Total Ujian</p>
		<p class="mt-1 text-3xl font-black text-primary-500">{data.myExams.length}</p>
	</div>
	<div class="card p-5 text-center">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Aktif</p>
		<p class="mt-1 text-3xl font-black text-green-600">{activeExams.length}</p>
	</div>
	<div class="card p-5 text-center">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Selesai</p>
		<p class="mt-1 text-3xl font-black text-(--text-secondary)">{finishedExams.length}</p>
	</div>
	<div class="card p-5 text-center">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">
			Rata-rata Nilai
		</p>
		{#if data.avgScore !== null}
			<p
				class="mt-1 text-3xl font-black {data.avgScore >= 75
					? 'text-green-600'
					: data.avgScore >= 50
						? 'text-yellow-600'
						: 'text-red-600'}"
			>
				{data.avgScore}
			</p>
		{:else}
			<p class="mt-1 text-3xl font-black text-(--text-secondary)">-</p>
		{/if}
	</div>
</div>

{#if activeExams.length > 0}
	<div class="mb-6">
		<h2 class="text-base font-black text-(--text-primary) mb-3 flex items-center gap-2">
			<span class="w-2 h-2 bg-green-500 border border-green-600 animate-pulse"></span>
			Ujian Berlangsung
		</h2>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
			{#each activeExams as p (p.id)}
				{@const exam = p.examRoom?.exam}
				{@const room = p.examRoom?.room}
				{#snippet footer()}
					<a
						href="/participant/exams/{p.examRoomId}"
						class="btn-primary w-full text-center text-sm"
					>
						Masuk Ruangan →
					</a>
				{/snippet}
				<ExamStatusCard
					{exam}
					{room}
					variant="active"
					timeText={exam ? `s/d ${new Date(exam.endTime).toLocaleString('id-ID', WIB)}` : undefined}
					{footer}
				/>
			{/each}
		</div>
	</div>
{/if}

{#if upcomingExams.length > 0}
	<div class="mb-6">
		<h2 class="text-base font-black text-(--text-primary) mb-3">Akan Datang</h2>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
			{#each upcomingExams as p (p.id)}
				{@const exam = p.examRoom?.exam}
				{@const room = p.examRoom?.room}
				<ExamStatusCard
					{exam}
					{room}
					variant="upcoming"
					timeText={exam
						? `${new Date(exam.startTime).toLocaleString('id-ID', WIB)} – ${new Date(exam.endTime).toLocaleString('id-ID', WIB)}`
						: undefined}
				/>
			{/each}
		</div>
	</div>
{/if}

{#if finishedExams.length > 0}
	<div class="mb-6">
		<h2 class="text-base font-black text-(--text-primary) mb-3">Ujian Selesai</h2>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
			{#each finishedExams as p (p.id)}
				{@const exam = p.examRoom?.exam}
				{@const room = p.examRoom?.room}
				{#snippet stat()}
					{#if p.submitted && p.score !== null}
						<p
							class="text-2xl font-black {p.score >= 75
								? 'text-green-600'
								: p.score >= 50
									? 'text-yellow-600'
									: 'text-red-600'}"
						>
							{p.score}
						</p>
						<p class="text-xs text-(--text-secondary)">nilai</p>
					{:else if p.submitted}
						<span class="text-xs text-(--text-secondary) italic">Belum dinilai</span>
					{:else}
						<span class="text-xs text-(--text-secondary) italic">Tidak submit</span>
					{/if}
				{/snippet}
				{#snippet footer()}
					{#if p.submitted}
						<a
							href="/participant/exams/{p.examRoomId}/answers"
							class="mt-3 btn-secondary w-full text-center text-xs block"
						>
							Lihat Jawaban
						</a>
					{/if}
				{/snippet}
				<ExamStatusCard {exam} {room} variant="finished" {stat} {footer} />
			{/each}
		</div>
	</div>
{/if}

{#if data.myExams.length === 0}
	<div class="card p-10 text-center font-bold text-(--text-secondary)">
		Belum ada ujian yang ditugaskan untuk Anda.
	</div>
{/if}
