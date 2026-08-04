<script lang="ts">
	import type { PageData } from './$types';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { data }: { data: PageData } = $props();

	const WIB: Intl.DateTimeFormatOptions = {
		timeZone: 'Asia/Jakarta',
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	};

	const statusLabel: Record<string, string> = {
		active: 'Berlangsung',
		upcoming: 'Akan Datang',
		finished: 'Selesai'
	};
	const statusVariant: Record<string, 'success' | 'info' | 'default'> = {
		active: 'success',
		upcoming: 'info',
		finished: 'default'
	};
</script>

<div class="mb-6">
	<h1 class="text-2xl font-black text-(--text-primary)">Dashboard Admin</h1>
	<p class="text-sm font-medium text-(--text-secondary)">Ringkasan aktivitas platform ujian.</p>
</div>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
	<div class="card p-5">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Total User</p>
		<p class="mt-1 text-3xl font-black text-primary-500">{data.stats.totalUsers}</p>
		<div class="mt-2 text-xs font-medium text-(--text-secondary) space-y-0.5">
			<p>{data.stats.adminCount} Admin</p>
			<p>{data.stats.supervisorCount} Pengawas</p>
			<p>{data.stats.participantCount} Peserta</p>
		</div>
	</div>
	<div class="card p-5">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Total Ujian</p>
		<p class="mt-1 text-3xl font-black text-primary-500">{data.stats.totalExams}</p>
		<div class="mt-2 text-xs font-medium space-y-0.5">
			<p class="text-green-600">{data.stats.activeExams} Berlangsung</p>
			<p class="text-blue-600">{data.stats.upcomingExams} Akan Datang</p>
			<p class="text-(--text-secondary)">{data.stats.finishedExams} Selesai</p>
		</div>
	</div>
	<div class="card p-5">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Ujian Aktif</p>
		<p class="mt-1 text-3xl font-black text-green-600">{data.stats.activeExams}</p>
		<p class="mt-2 text-xs font-medium text-(--text-secondary)">Sedang berlangsung</p>
	</div>
	<div class="card p-5">
		<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Total Ruangan</p>
		<p class="mt-1 text-3xl font-black text-primary-500">{data.stats.totalRooms}</p>
		<p class="mt-2 text-xs font-medium text-(--text-secondary)">Ruangan terdaftar</p>
	</div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
	<div class="card p-6 lg:col-span-2">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-base font-black text-(--text-primary)">Ujian Terbaru</h2>
			<a
				href="/admin/exams"
				class="text-xs font-black text-primary-500 transition-all duration-100 hover:-translate-x-0.5"
				>Lihat semua →</a
			>
		</div>
		{#if data.recentExams.length === 0}
			<p class="text-sm font-medium text-(--text-secondary) text-center py-4">Belum ada ujian.</p>
		{:else}
			<div class="space-y-1">
				{#each data.recentExams as exam}
					<a
						href="/admin/exams/{exam.id}/rooms"
						class="flex items-center justify-between p-3 rounded-md transition-colors hover:bg-(--bg-secondary)"
					>
						<div class="min-w-0 flex-1 mr-3">
							<p class="text-sm font-black text-(--text-primary) truncate">{exam.name}</p>
							<p class="text-xs font-medium text-(--text-secondary) mt-0.5">
								{new Date(exam.startTime).toLocaleString('id-ID', WIB)} – {new Date(
									exam.endTime
								).toLocaleString('id-ID', WIB)}
							</p>
						</div>
						<Badge
							variant={statusVariant[exam.status] ?? 'default'}
							class="shrink-0 text-xs font-black"
						>
							{statusLabel[exam.status] ?? exam.status}
						</Badge>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<div class="card p-6">
		<h2 class="text-base font-black text-(--text-primary) mb-4">Aksi Cepat</h2>
		<div class="space-y-3">
			<a href="/admin/exams" class="flex w-full items-center gap-2 btn-primary">
				<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Buat Ujian Baru
			</a>
			<a href="/admin/users" class="flex w-full items-center gap-2 btn-secondary">
				<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
					/>
				</svg>
				Tambah User
			</a>
			<a href="/admin/rooms" class="flex w-full items-center gap-2 btn-secondary">
				<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
					/>
				</svg>
				Kelola Ruangan
			</a>
			<a href="/admin/results" class="flex w-full items-center gap-2 btn-secondary">
				<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				Lihat Hasil Ujian
			</a>
		</div>
	</div>
</div>
