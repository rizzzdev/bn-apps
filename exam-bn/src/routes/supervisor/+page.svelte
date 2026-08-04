<script lang="ts">
	import type { PageData } from './$types';
	import ExamStatusCard from '$lib/components/ExamStatusCard.svelte';

	let { data }: { data: PageData } = $props();

	const WIB: Intl.DateTimeFormatOptions = {
		timeZone: 'Asia/Jakarta',
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	};
</script>

<div class="mb-6">
	<h1 class="text-2xl font-black text-(--text-primary)">Dashboard Pengawas</h1>
	<p class="text-sm font-medium text-(--text-secondary) mt-1">Ruangan ujian yang Anda awasi.</p>
</div>

<div class="grid grid-cols-3 gap-4 mb-6">
	<div class="card p-5 text-center">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Total Ruangan</p>
		<p class="mt-1 text-3xl font-black text-primary-500">{data.myRooms.length}</p>
	</div>
	<div class="card p-5 text-center">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Aktif</p>
		<p class="mt-1 text-3xl font-black text-green-600">{data.activeRooms.length}</p>
	</div>
	<div class="card p-5 text-center">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Akan Datang</p>
		<p class="mt-1 text-3xl font-black text-blue-600">{data.upcomingRooms.length}</p>
	</div>
</div>

{#if data.activeRooms.length > 0}
	<div class="mb-6">
		<h2 class="text-base font-black text-(--text-primary) mb-3 flex items-center gap-2">
			<span class="w-2 h-2 bg-green-500 border border-green-600 animate-pulse"></span>
			Ujian Berlangsung
		</h2>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
			{#each data.activeRooms as s (s.id)}
				{@const exam = s.examRoom?.exam}
				{@const room = s.examRoom?.room}
				{#snippet stat()}
					<p class="text-2xl font-black text-green-600">{s.submittedCount}</p>
					<p class="text-xs font-medium text-(--text-secondary)">/{s.totalParticipants} submit</p>
				{/snippet}
				{#snippet footer()}
					<a href="/supervisor/rooms/{s.examRoomId}" class="btn-primary w-full text-center text-sm">
						Pantau Ruangan →
					</a>
				{/snippet}
				<ExamStatusCard
					{exam}
					{room}
					variant="active"
					timeText={exam ? `s/d ${new Date(exam.endTime).toLocaleString('id-ID', WIB)}` : undefined}
					{stat}
					{footer}
				/>
			{/each}
		</div>
	</div>
{/if}

{#if data.upcomingRooms.length > 0}
	<div class="mb-6">
		<h2 class="text-base font-black text-(--text-primary) mb-3">Akan Datang</h2>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
			{#each data.upcomingRooms as s (s.id)}
				{@const exam = s.examRoom?.exam}
				{@const room = s.examRoom?.room}
				{#snippet extra()}
					<p class="text-xs font-medium text-(--text-secondary) mt-1">
						{s.totalParticipants} peserta terdaftar
					</p>
				{/snippet}
				<ExamStatusCard
					{exam}
					{room}
					variant="upcoming"
					timeText={exam
						? `${new Date(exam.startTime).toLocaleString('id-ID', WIB)} – ${new Date(exam.endTime).toLocaleString('id-ID', WIB)}`
						: undefined}
					{extra}
				/>
			{/each}
		</div>
	</div>
{/if}

{#if data.finishedRooms.length > 0}
	<div class="mb-6">
		<h2 class="text-base font-black text-(--text-primary) mb-3">Ujian Selesai</h2>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
			{#each data.finishedRooms as s (s.id)}
				{@const exam = s.examRoom?.exam}
				{@const room = s.examRoom?.room}
				{#snippet stat()}
					<p class="text-2xl font-black text-(--text-secondary)">
						{s.submittedCount}/{s.totalParticipants}
					</p>
					<p class="text-xs text-(--text-secondary)">submit</p>
				{/snippet}
				{#snippet footer()}
					<a
						href="/supervisor/rooms/{s.examRoomId}"
						class="mt-3 btn-secondary w-full text-center text-xs block"
					>
						Lihat Detail
					</a>
				{/snippet}
				<ExamStatusCard {exam} {room} variant="finished" {stat} {footer} />
			{/each}
		</div>
	</div>
{/if}

{#if data.myRooms.length === 0}
	<div class="card p-10 text-center font-bold text-(--text-secondary)">
		Belum ada ruangan ujian yang ditugaskan untuk Anda.
	</div>
{/if}
