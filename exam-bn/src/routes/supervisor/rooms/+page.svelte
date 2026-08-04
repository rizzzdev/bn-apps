<script lang="ts">
	import { onMount } from 'svelte';
	import { connectSocket } from '$lib/stores/socket';

	let { data }: { data: any } = $props();

	type RoomStatus = 'upcoming' | 'live' | 'ended';
	let statusOverrides = $state<Record<string, RoomStatus>>({});

	function statusOf(examRoomId: string, exam?: { startTime: string; endTime: string }): RoomStatus {
		if (statusOverrides[examRoomId]) return statusOverrides[examRoomId];
		const now = new Date();
		if (!exam) return 'upcoming';
		if (new Date(exam.endTime) < now) return 'ended';
		if (new Date(exam.startTime) <= now) return 'live';
		return 'upcoming';
	}

	const WIB: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta' };

	onMount(() => {
		if (!data.token || data.myRooms.length === 0) return;

		const s = connectSocket(data.token);
		function joinAll() {
			for (const room of data.myRooms)
				s.emit('exam:supervisor:join', { examRoomId: room.examRoomId });
		}
		s.on('connect', () => joinAll());
		if (s.connected) joinAll();
		s.on('exam:started', (payload) => {
			if (statusOverrides[payload.examRoomId] !== 'ended')
				statusOverrides = { ...statusOverrides, [payload.examRoomId]: 'live' };
		});
		s.on('exam:ended', (payload) => {
			statusOverrides = { ...statusOverrides, [payload.examRoomId]: 'ended' };
		});
	});
</script>

<div class="mb-6">
	<h1 class="text-2xl font-black text-(--text-primary)">Daftar Ruangan Pengawasan</h1>
	<p class="text-sm font-medium text-(--text-secondary) mt-1">
		Pilih ruangan untuk memantau aktivitas peserta.
	</p>
</div>

{#if data.myRooms.length === 0}
	<div class="card p-8 text-center font-bold text-(--text-secondary)">
		Belum ada ruangan ujian yang ditugaskan untuk Anda.
	</div>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each data.myRooms as s (s.id)}
			{@const exam = s.examRoom?.exam}
			{@const room = s.examRoom?.room}
			{@const status = statusOf(s.examRoomId, exam)}
			<div class="card flex flex-col overflow-hidden">
				<div class="card-header flex justify-between items-center">
					<h3 class="text-base font-black text-(--text-primary) truncate">{room?.name ?? '-'}</h3>
					{#if status === 'live'}
						<span class="badge badge-success animate-pulse">Live</span>
					{:else if status === 'ended'}
						<span class="badge badge-danger">Selesai</span>
					{:else}
						<span class="badge">Menunggu</span>
					{/if}
				</div>
				<div class="p-5 flex-1 flex flex-col">
					<div class="mb-4">
						<p class="text-sm font-black text-primary-500">{exam?.name ?? '-'}</p>
						{#if exam}
							<p class="text-xs font-medium text-(--text-secondary) mt-1">
								{new Date(exam.startTime).toLocaleString('id-ID', WIB)} &ndash; {new Date(
									exam.endTime
								).toLocaleString('id-ID', WIB)}
							</p>
						{/if}
					</div>
					<div class="mt-auto">
						<a href="/supervisor/rooms/{s.examRoomId}" class="btn-primary w-full text-center"
							>Pantau Ruangan</a
						>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
