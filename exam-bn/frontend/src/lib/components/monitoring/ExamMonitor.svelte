<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { connectSocket, connected } from '$lib/stores/socket';
	import { createCountdown } from '$lib/utils/timer';
	import ParticipantCard from '$lib/components/supervisor/ParticipantCard.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { goto } from '$app/navigation';

	// Shared room-monitoring view used by both the supervisor's own room
	// detail page and the admin "Pantau Ruangan" view. `role` decides which
	// join event is used and whether the >5-violation unlock cap applies.
	let { data, role = 'SUPERVISOR' }: { data: any; role?: 'SUPERVISOR' | 'ADMIN' } = $props();

	const SUPERVISOR_UNLOCK_VIOLATION_LIMIT = 5;

	const WIB: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta' };

	type ParticipantStatus = {
		userId: string;
		username: string;
		fullname: string;
		isLocked: boolean;
		violationCount: number;
		lastViolationType: string | null;
		isOnline: boolean;
	};

	type LogEntry = { time: string; type: string; message: string };

	let participants = $state<ParticipantStatus[]>([]);
	// Seeded once from the initial page load in onMount below, then mutated
	// live by socket events — not meant to track `data` reactively afterward.
	let logs = $state<LogEntry[]>([]);
	let examStatus = $state<'PENDING' | 'ONGOING' | 'ENDED'>('PENDING');
	let examStarted = $state(false);
	let startedAt = $state<string | null>(null);

	// Warning dialog state
	let warnTarget = $state<{ userId: string; fullname: string } | null>(null);
	let warnMessage = $state('');
	let warnSending = $state(false);

	let timeLeft = $state('');
	let stopTimer: (() => void) | null = null;

	function addLog(type: string, message: string) {
		const time = new Date().toLocaleTimeString('id-ID', WIB);
		logs = [{ time, type, message }, ...logs].slice(0, 200);
	}

	function canUnlock(p: ParticipantStatus): boolean {
		return role === 'ADMIN' || p.violationCount <= SUPERVISOR_UNLOCK_VIOLATION_LIMIT;
	}

	// Focuses the warning textarea when the dialog opens, without the a11y
	// pitfalls of the `autofocus` HTML attribute.
	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	let socket = $state<ReturnType<typeof connectSocket> | null>(null);

	onMount(() => {
		logs = [...(data.initialLogs ?? [])]
			.sort(
				(a: { createdAt: string }, b: { createdAt: string }) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
			.map((l: { type: string; message: string; createdAt: string }) => ({
				type: l.type,
				message: l.message,
				time: new Date(l.createdAt).toLocaleTimeString('id-ID', WIB)
			}));
		examStatus = data.examStatus ?? 'PENDING';
		participants = data.initialStatuses || [];
		examStarted = data.examStarted;
		startedAt = data.startedAt;

		const endTime = data.examRoom?.exam?.endTime ? new Date(data.examRoom.exam.endTime) : null;
		stopTimer = createCountdown(
			() => endTime,
			(display) => {
				timeLeft = display;
			}
		);

		if (!data.token) return;

		socket = connectSocket(data.token);

		const joinEvent = role === 'ADMIN' ? 'exam:monitor:join' : 'exam:supervisor:join';
		function joinRoom() {
			socket!.emit(joinEvent, { examRoomId: data.examRoomId });
		}

		socket.on('connect', joinRoom);
		if (socket.connected) joinRoom();

		socket.on('disconnect', () => {
			addLog('system', 'Koneksi terputus.');
		});

		socket.on('exam:room:status', (statuses) => {
			participants = [...statuses];
		});

		socket.on('exam:started', (payload) => {
			examStarted = true;
			examStatus = 'ONGOING';
			startedAt = payload.startedAt;
			addLog(
				'system',
				`Ujian dimulai pada ${new Date(payload.startedAt).toLocaleTimeString('id-ID', WIB)}.`
			);
		});

		socket.on('exam:ended', (payload) => {
			examStatus = 'ENDED';
			examStarted = false;
			addLog(
				'system',
				`Ujian telah berakhir pada ${new Date(payload.endedAt).toLocaleTimeString('id-ID', WIB)}.`
			);
		});

		socket.on('exam:participant:violated', (payload) => {
			addLog(
				'violation',
				`${(payload as any).fullname ?? payload.username} melakukan pelanggaran: ${payload.violationType} (ke-${payload.violationCount}).`
			);
		});

		socket.on('exam:participant:warned', (payload) => {
			addLog('warning', `Peringatan dikirim ke ${payload.fullname ?? payload.userId}.`);
		});

		socket.on('exam:error', (payload) => {
			addLog('system', `Error: ${payload.message}`);
		});
	});

	onDestroy(() => {
		stopTimer?.();
		// Socket connection is owned by the layout (keeps the global chat bubble alive
		// across navigation), so it is intentionally not disconnected here.
	});

	function unlockParticipant(participantUserId: string) {
		socket?.emit('exam:unlock', { examRoomId: data.examRoomId, participantUserId });
		addLog('system', 'Membuka kunci peserta...');
	}

	function openWarnDialog(userId: string, fullname: string) {
		warnTarget = { userId, fullname };
		warnMessage = '';
	}

	function closeWarnDialog() {
		warnTarget = null;
		warnMessage = '';
		warnSending = false;
	}

	async function sendWarning() {
		if (!warnTarget || !warnMessage.trim() || !socket) return;
		warnSending = true;
		socket.emit('exam:warn', {
			examRoomId: data.examRoomId,
			targetUserId: warnTarget.userId,
			message: warnMessage.trim()
		});
		addLog('warning', `Peringatan dikirim ke ${warnTarget.fullname}: "${warnMessage.trim()}"`);
		closeWarnDialog();
	}

	function navigateToMonitor(userId: string) {
		if (role === 'ADMIN') {
			goto(`/admin/exams/${data.examRoom?.examId ?? data.examId}/rooms/${data.examRoomId}/answers/${userId}`);
		} else {
			goto(`/supervisor/rooms/${data.examRoomId}/answers/${userId}`);
		}
	}
</script>

<!-- Header -->
<div class="mb-6 flex flex-wrap justify-between items-center gap-4">
	<div class="flex items-center gap-3">
		<a
			href={role === 'ADMIN' ? `/admin/exams/${data.examRoom.examId}/rooms/` : '/supervisor/rooms'}
			class="btn-secondary p-2"
			aria-label="Kembali"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
		</a>
		<div>
			<h1 class="text-2xl font-black text-(--text-primary)">
				{data.examRoom?.room?.name ?? 'Ruangan'}
			</h1>
			<p class="text-sm font-medium text-(--text-secondary) mt-0.5">
				{data.examRoom?.exam?.name ?? ''}
			</p>
		</div>
	</div>
	<div class="flex items-center gap-3 flex-wrap">
		{#if timeLeft && examStatus === 'ONGOING'}
			<div
				class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono font-black"
				style={timeLeft < '00:10:00'
					? 'border: 2px solid #ef4444; background-color: #fef2f2; color: #dc2626;'
					: 'border: 2px solid var(--nb-border); background-color: var(--bg-secondary); color: var(--text-primary);'}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				{timeLeft}
			</div>
		{/if}
		{#if examStatus === 'ENDED'}
			<Badge size="lg" class="font-black gap-1.5">
				<span class="w-2 h-2 bg-gray-400"></span>
				Ujian Berakhir
			</Badge>
		{:else if examStatus === 'ONGOING'}
			<Badge variant="success" size="lg" class="font-black gap-1.5">
				<span class="w-2 h-2 bg-green-500 animate-pulse"></span>
				Ujian Berlangsung
			</Badge>
		{:else}
			<Badge variant="warning" size="lg" class="font-black gap-1.5">
				<span class="w-2 h-2 bg-yellow-400 animate-pulse"></span>
				Menunggu Jadwal
			</Badge>
		{/if}
		<Badge variant={$connected ? 'success' : 'default'} size="lg" class="font-black gap-1.5">
			<span class="w-2 h-2 {$connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}"></span>
			{$connected ? 'Koneksi Aktif' : 'Menghubungkan...'}
		</Badge>
	</div>
</div>

<div class="monitor-grid grid grid-cols-1 xl:grid-cols-3 gap-6">
	<!-- Participants Grid -->
	<div class="card xl:col-span-2 flex flex-col h-full overflow-hidden">
		<div class="card-header flex items-center justify-between">
			<h2 class="text-base font-black text-(--text-primary)">
				Status Peserta
				<span class="ml-2 text-sm font-medium text-(--text-secondary)"
					>({participants.filter((p) => p.isOnline).length}/{participants.length} online)</span
				>
			</h2>
		</div>
		<div class="flex-1 overflow-y-auto p-4">
			{#if participants.length === 0}
				<p class="text-sm font-medium text-(--text-secondary) text-center py-8">
					Menunggu peserta bergabung...
				</p>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					{#each participants as p (p.userId)}
						<ParticipantCard
							participant={p}
							{examStatus}
							canUnlock={canUnlock(p)}
							onUnlock={unlockParticipant}
							onWarn={examStatus === 'ONGOING' ? openWarnDialog : undefined}
							onMonitor={navigateToMonitor}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Right panel: Log Aktivitas -->
	<div class="card flex flex-col h-full overflow-hidden">
		<div class="card-header">
			<h2 class="text-base font-black text-(--text-primary)">Log Aktivitas</h2>
		</div>
		<div class="flex-1 overflow-y-auto p-4 space-y-4">
			{#each logs as log, i (i)}
				<div class="flex gap-3">
					<div class="mt-1 shrink-0">
						{#if log.type === 'violation'}
							<div class="w-2 h-2 bg-red-500 border-2 border-red-300"></div>
						{:else if log.type === 'warning'}
							<div class="w-2 h-2 bg-orange-500 border-2 border-orange-300"></div>
						{:else if log.type === 'join'}
							<div class="w-2 h-2 bg-green-500 border-2 border-green-300"></div>
						{:else if log.type === 'submit'}
							<div class="w-2 h-2 bg-purple-500 border-2 border-purple-300"></div>
						{:else if log.type === 'disconnect'}
							<div class="w-2 h-2 bg-yellow-500 border-2 border-yellow-200"></div>
						{:else}
							<div class="w-2 h-2 bg-blue-500 border-2 border-blue-300"></div>
						{/if}
					</div>
					<div>
						<p class="text-xs font-medium text-(--text-secondary) mb-0.5">{log.time}</p>
						<p class="text-sm font-medium text-(--text-primary)">{log.message}</p>
					</div>
				</div>
			{:else}
				<p class="text-sm font-medium text-(--text-secondary) text-center py-4">
					Belum ada aktivitas.
				</p>
			{/each}
		</div>
	</div>
</div>

<!-- Warning Dialog -->
{#if warnTarget}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div
			class="bg-(--nb-card-bg) max-w-md w-full p-6 space-y-4"
			style="border: 3px solid var(--nb-border); box-shadow: 6px 6px 0 0 var(--nb-border);"
		>
			<div>
				<h2 class="font-black text-(--text-primary) text-lg">Kirim Peringatan</h2>
				<p class="text-sm text-(--text-secondary) mt-0.5">
					Kepada: <strong>{warnTarget.fullname}</strong>
				</p>
			</div>

			<textarea
				class="input-field w-full resize-none"
				rows="4"
				placeholder="Tulis pesan peringatan..."
				bind:value={warnMessage}
				use:focusOnMount
			></textarea>

			<div class="flex gap-3">
				<button class="btn-secondary flex-1" onclick={closeWarnDialog} disabled={warnSending}>
					Batal
				</button>
				<button
					class="btn-primary flex-1 font-black"
					onclick={sendWarning}
					disabled={!warnMessage.trim() || warnSending}
				>
					{warnSending ? 'Mengirim...' : 'Kirim Peringatan'}
				</button>
			</div>
		</div>
	</div>
{/if}
