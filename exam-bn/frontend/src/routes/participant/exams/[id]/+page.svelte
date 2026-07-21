<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { connectSocket } from '$lib/stores/socket';
	import { beforeNavigate } from '$app/navigation';
	import { createCountdown } from '$lib/utils/timer';
	import ExamOption from '$lib/components/ui/ExamOption.svelte';
	import type { Socket } from 'socket.io-client';
	import type { PageData } from './$types';
	import WarningModal from '$lib/components/participant/WarningModal.svelte';
	import { pushWarning } from '$lib/stores/warnings';
	import { addToast } from '$lib/stores/toast';
	import { resolveBackendUrl } from '$lib/utils/backend-url';
	import { examStatus } from '$lib/state/examStatus.svelte';

	let { data }: { data: PageData } = $props();

	const WIB: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta' };
	const API_BASE = resolveBackendUrl() + '/api/v1';

	const d = untrack(() => data as any);

	let examStarted = $state<boolean>(d.examStarted ?? false);
	let alreadySubmitted = $state<boolean>(d.alreadySubmitted ?? false);
	let examExpired = $state<boolean>(d.examExpiredInit ?? false);
	let consentGiven = $state(false);
	let isLocked = $state(false);
	let lockReason = $state('');
	let currentQuestionIndex = $state(0);
	let submitting = $state(false);
	let submitResult = $state<{ score: number | null; autoScored: boolean } | null>(null);
	let showSubmitModal = $state(false);
	let showMobileNav = $state(false);
	let socket: Socket | null = null;
	let blurWarnings = $state(0);

	let savingQuestions = $state<Set<string>>(new Set());
	let essayDirty = $state<Set<string>>(new Set());
	let offlineQueue = $state<Set<string>>(new Set());

	const questions = d.questions ?? [];
	const endTime = d.examRoom?.exam?.endTime ? new Date(d.examRoom.exam.endTime) : null;
	const startTime = d.examRoom?.exam?.startTime ? new Date(d.examRoom.exam.startTime) : null;

	let selectedOptions = $state<Record<string, string>>(
		Object.fromEntries(
			Object.entries((d.answers ?? {}) as Record<string, any>)
				.filter(([, a]) => a.optionId)
				.map(([qId, a]) => [qId, a.optionId!])
		)
	);
	let savedAnswers = $state<
		Record<string, { id: string; optionId?: string | null; text?: string | null }>
	>(
		Object.fromEntries(
			Object.entries((d.answers ?? {}) as Record<string, any>).map(([qId, a]) => [
				qId,
				{ id: a.id, optionId: a.optionId, text: a.text }
			])
		)
	);
	let essayTexts = $state<Record<string, string>>(
		Object.fromEntries(
			Object.entries((d.answers ?? {}) as Record<string, any>)
				.filter(([, a]) => a.text != null)
				.map(([qId, a]) => [qId, a.text ?? ''])
		)
	);

	const currentQuestion = $derived(questions[currentQuestionIndex]);
	const answeredCount = $derived(
		Object.keys(selectedOptions).length +
			Object.keys(essayTexts).filter((k) => essayTexts[k]?.trim()).length
	);

	let timeLeft: string = $state('');
	let stopTimer: (() => void) | null = null;
	let autoStartTimeout: ReturnType<typeof setTimeout>;

	function checkAutoStart() {
		if (!startTime || examStarted) return;
		const ms = startTime.getTime() - Date.now();
		if (ms <= 0) {
			examStarted = true;
		} else {
			autoStartTimeout = setTimeout(() => {
				examStarted = true;
			}, ms);
		}
	}

	const mcSaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	function selectOption(questionId: string, optionId: string) {
		selectedOptions[questionId] = optionId;
		clearTimeout(mcSaveTimers[questionId]);
		mcSaveTimers[questionId] = setTimeout(() => saveMcOption(questionId, optionId), 2000);
	}

	async function saveMcOption(questionId: string, optionId: string) {
		savingQuestions = new Set([...savingQuestions, questionId]);
		const existing = savedAnswers[questionId];
		try {
			if (existing?.id) {
				const res = await fetch(`${API_BASE}/exam-answers/${existing.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d.token}` },
					body: JSON.stringify({ optionId })
				});
				if (!res.ok) throw new Error('Failed to save');
				savedAnswers[questionId] = { ...existing, optionId };
			} else {
				const res = await fetch(`${API_BASE}/exam-answers`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d.token}` },
					body: JSON.stringify({ examRoomId: d.examRoomId, userId: d.userId, questionId, optionId })
				});
				if (!res.ok) throw new Error('Failed to save');
				const json = (await res.json()) as { data: { id: string } };
				savedAnswers[questionId] = { id: json.data.id, optionId };
			}
			offlineQueue = new Set([...offlineQueue].filter((id) => id !== questionId));
		} catch {
			if (!offlineQueue.has(questionId)) {
				addToast('Koneksi tidak stabil, jawaban disimpan secara lokal dan akan diulang otomatis.', 'error');
			}
			offlineQueue = new Set([...offlineQueue, questionId]);
			setTimeout(() => {
				if (offlineQueue.has(questionId)) saveMcOption(questionId, optionId);
			}, 5000);
		} finally {
			savingQuestions = new Set([...savingQuestions].filter((id) => id !== questionId));
		}
	}

	const essaySaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	function onEssayInput(questionId: string, text: string) {
		essayTexts[questionId] = text;
		essayDirty = new Set([...essayDirty, questionId]);
		clearTimeout(essaySaveTimers[questionId]);
		// Debounce set to 5000ms as per user request
		essaySaveTimers[questionId] = setTimeout(() => saveEssay(questionId, text), 5000);
	}
	async function saveEssay(questionId: string, text: string) {
		const existing = savedAnswers[questionId];
		try {
			if (existing?.id) {
				const res = await fetch(`${API_BASE}/exam-answers/${existing.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d.token}` },
					body: JSON.stringify({ text })
				});
				if (!res.ok) throw new Error('Failed to save');
				savedAnswers[questionId] = { ...existing, text };
			} else {
				const res = await fetch(`${API_BASE}/exam-answers`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d.token}` },
					body: JSON.stringify({ examRoomId: d.examRoomId, userId: d.userId, questionId, text })
				});
				if (!res.ok) throw new Error('Failed to save');
				const json = (await res.json()) as { data: { id: string } };
				savedAnswers[questionId] = { id: json.data.id, text };
			}
			offlineQueue = new Set([...offlineQueue].filter((id) => id !== questionId));
		} catch {
			if (!offlineQueue.has(questionId)) {
				addToast('Gagal menyimpan draf esai. Periksa koneksi Anda.', 'error');
			}
			offlineQueue = new Set([...offlineQueue, questionId]);
			setTimeout(() => {
				if (offlineQueue.has(questionId)) saveEssay(questionId, text);
			}, 5000);
		} finally {
			essayDirty = new Set([...essayDirty].filter((id) => id !== questionId));
		}
	}

	async function submitExam() {
		if (submitting || alreadySubmitted) return;
		submitting = true;
		showSubmitModal = false;
		try {
			const res = await fetch(`${API_BASE}/exam-rooms/${d.examRoomId}/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d.token}` },
				body: JSON.stringify({ userId: d.userId })
			});
			if (res.ok) {
				const json = (await res.json()) as { data: { score: number | null; autoScored: boolean } };
				submitResult = json.data;
				alreadySubmitted = true;
			} else if (res.status === 409) {
				alreadySubmitted = true;
				addToast('Ujian ini sudah Anda kumpulkan sebelumnya.', 'info');
			}
		} catch {
			/* */
		} finally {
			submitting = false;
		}
	}

	function autoSubmitIfNeeded() {
		if (consentGiven && examStarted && !alreadySubmitted && !submitting) submitExam();
	}

	function lockExam(reason: string, violationType: string) {
		if (!examStarted || !consentGiven || isLocked || alreadySubmitted) return;
		isLocked = true;
		lockReason = reason;
		socket?.emit('exam:violation', { examRoomId: d.examRoomId, violationType });
	}

	function checkStrike(reason: string, violationType: string) {
		if (!examStarted || !consentGiven || isLocked || alreadySubmitted) return;
		blurWarnings++;
		if (blurWarnings >= 4) {
			lockExam(reason, violationType);
		} else {
			addToast(`Peringatan (${blurWarnings}/3): ${reason} Jangan diulangi!`, 'error');
		}
	}

	function handleVisibilityChange() {
		if (consentGiven && examStarted && !isLocked && !alreadySubmitted && document.hidden)
			checkStrike('Berpindah tab atau minimize browser.', 'TAB_SWITCH');
	}
	function handleWindowBlur() {
		if (consentGiven && examStarted && !isLocked && !alreadySubmitted)
			checkStrike('Fokus berpindah dari jendela ujian.', 'WINDOW_BLUR');
	}
	function handleKeydown(e: KeyboardEvent) {
		if (!consentGiven || !examStarted || isLocked || alreadySubmitted) return;
		if (e.key === 'F12') {
			lockExam('Percobaan membuka DevTools.', 'DEVTOOLS_OPEN');
			return;
		}
		if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(e.key)) {
			lockExam('Percobaan membuka DevTools.', 'DEVTOOLS_OPEN');
			return;
		}
		if (e.ctrlKey && ['u', 's'].includes(e.key.toLowerCase())) {
			lockExam('Percobaan mengakses source/menyimpan.', 'VIEW_SOURCE');
			return;
		}
		if (e.ctrlKey && e.key.toLowerCase() === 'p') {
			lockExam('Percobaan mencetak halaman ujian.', 'PRINT_ATTEMPT');
			return;
		}
		if (e.ctrlKey && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
			lockExam('Percobaan menyalin/menempel konten.', 'COPY_PASTE');
			return;
		}
		if (e.key === 'PrintScreen') {
			checkStrike('Percobaan screenshot terdeteksi.', 'SCREENSHOT_ATTEMPT');
			return;
		}
		if (e.altKey && e.key === 'Tab') {
			checkStrike('Berpindah jendela dengan Alt+Tab.', 'TAB_SWITCH');
		}
	}
	function handleContextmenu() {
		if (consentGiven && examStarted && !isLocked && !alreadySubmitted)
			lockExam('Klik kanan terdeteksi.', 'CONTEXT_MENU');
	}
	function handleCopy() {
		if (consentGiven && examStarted && !isLocked && !alreadySubmitted)
			lockExam('Percobaan menyalin konten ujian.', 'COPY_ATTEMPT');
	}
	function handleDragStart() {
		if (consentGiven && examStarted && !isLocked && !alreadySubmitted)
			lockExam('Percobaan menyeret konten.', 'DRAG_ATTEMPT');
	}
	function handleBeforePrint() {
		if (consentGiven && examStarted && !isLocked && !alreadySubmitted)
			lockExam('Percobaan mencetak halaman ujian.', 'PRINT_ATTEMPT');
	}

	beforeNavigate(({ cancel }) => {
		if (consentGiven && examStarted && !isLocked && !alreadySubmitted) {
			lockExam('Berusaha meninggalkan halaman ujian.', 'LEAVE_PAGE');
			cancel();
		}
	});

	function handleBeforeUnload(e: BeforeUnloadEvent) {
		if (consentGiven && examStarted && !alreadySubmitted) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	let devtoolsInterval: ReturnType<typeof setInterval>;
	function checkDevTools() {
		if (!consentGiven || !examStarted || isLocked || alreadySubmitted) return;
		if (
			window.outerWidth - window.innerWidth > 160 ||
			window.outerHeight - window.innerHeight > 160
		)
			lockExam('DevTools terdeteksi terbuka.', 'DEVTOOLS_OPEN');
	}

	function patchScreenCapture() {
		if (!navigator.mediaDevices) return;
		const original = navigator.mediaDevices.getDisplayMedia?.bind(navigator.mediaDevices);
		if (!original) return;
		navigator.mediaDevices.getDisplayMedia = async () => {
			lockExam('Percobaan perekaman layar terdeteksi.', 'SCREEN_CAPTURE');
			throw new DOMException('Screen capture blocked during exam', 'NotAllowedError');
		};
		return () => {
			if (navigator.mediaDevices) navigator.mediaDevices.getDisplayMedia = original;
		};
	}

	let unpatchScreenCapture: (() => void) | undefined;

	function setupExamSocket(s: Socket) {
		s.on('exam:locked', ({ reason }: { reason: string }) => {
			isLocked = true;
			lockReason = reason;
		});
		s.on('exam:unlocked', () => {
			isLocked = false;
			lockReason = '';
		});
		s.on('exam:session', (session: { isLocked: boolean }) => {
			if (session.isLocked) {
				isLocked = true;
				lockReason = 'Sesi ujian Anda sedang terkunci.';
			}
		});
		s.on('exam:started', () => {
			examStarted = true;
			clearTimeout(autoStartTimeout);
		});
		s.on('exam:ended', () => {
			if (!examExpired) examExpired = true;
			autoSubmitIfNeeded();
		});
		s.on('exam:warn', (payload: { message: string; fromName?: string }) => {
			pushWarning(payload.message, payload.fromName ?? 'Pengawas');
		});
	}

	onMount(() => {
		socket = connectSocket(d.token);

		document.addEventListener('visibilitychange', handleVisibilityChange);
		document.addEventListener('keydown', handleKeydown);
		document.addEventListener('contextmenu', handleContextmenu);
		document.addEventListener('copy', handleCopy);
		document.addEventListener('dragstart', handleDragStart);
		window.addEventListener('blur', handleWindowBlur);
		window.addEventListener('beforeprint', handleBeforePrint);
		window.addEventListener('beforeunload', handleBeforeUnload);

		devtoolsInterval = setInterval(checkDevTools, 3000);
		unpatchScreenCapture = patchScreenCapture();

		setupExamSocket(socket);
		socket.on('connect', () => socket!.emit('exam:join', { examRoomId: d.examRoomId }));
		if (socket.connected) socket.emit('exam:join', { examRoomId: d.examRoomId });

		stopTimer = createCountdown(
			() => endTime,
			(display, expired) => {
				timeLeft = display;
				if (expired && !examExpired) {
					examExpired = true;
					autoSubmitIfNeeded();
				}
			}
		);
		checkAutoStart();
	});

	onDestroy(() => {
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		document.removeEventListener('keydown', handleKeydown);
		document.removeEventListener('contextmenu', handleContextmenu);
		document.removeEventListener('copy', handleCopy);
		document.removeEventListener('dragstart', handleDragStart);
		window.removeEventListener('blur', handleWindowBlur);
		window.removeEventListener('beforeprint', handleBeforePrint);
		window.removeEventListener('beforeunload', handleBeforeUnload);
		clearInterval(devtoolsInterval);
		clearTimeout(autoStartTimeout);
		unpatchScreenCapture?.();
		stopTimer?.();
	});
</script>

<svelte:head>
	<title>Ujian Aktif - Exam-BN</title>
</svelte:head>

<WarningModal />

{#if alreadySubmitted}
	<div class="flex items-center justify-center py-16">
		<div class="card-success max-w-md w-full p-10 text-center space-y-6">
			<div class="icon-circle-green w-20 h-20 flex items-center justify-center mx-auto">
				<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<h2 class="text-2xl font-black text-(--text-primary)">Ujian Dikumpulkan!</h2>
			{#if submitResult?.autoScored && submitResult.score !== null}
				<p class="text-4xl font-black text-primary-500">
					{submitResult.score}<span class="text-xl font-medium text-(--text-secondary)">
						/ 100</span
					>
				</p>
				<p class="text-sm font-medium text-(--text-secondary)">Skor Anda dihitung otomatis.</p>
			{:else}
				<p class="text-sm font-medium text-(--text-secondary)">
					Jawaban Anda berhasil dikumpulkan. Skor akan diumumkan oleh pengawas.
				</p>
			{/if}
			<a href="/participant" class="btn-primary inline-block w-full">Kembali ke Dashboard</a>
		</div>
	</div>
{:else if examExpired}
	<div class="flex items-center justify-center py-16">
		<div class="card max-w-md w-full p-10 text-center space-y-6">
			<div class="nav-btn w-20 h-20 flex items-center justify-center mx-auto rounded-md">
				<svg
					class="w-10 h-10 text-(--text-secondary)"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<h2 class="text-2xl font-black text-(--text-primary)">Waktu Ujian Telah Habis</h2>
			<p class="text-sm font-medium text-(--text-secondary)">
				{submitting
					? 'Mengumpulkan jawaban Anda secara otomatis...'
					: 'Waktu ujian sudah berakhir.'}
			</p>
			{#if submitting}
				<div class="flex items-center justify-center gap-2 text-sm font-medium text-primary-500">
					<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Menyimpan jawaban...
				</div>
			{:else}
				<a href="/participant/exams" class="btn-primary inline-block w-full"
					>Kembali ke Daftar Ujian</a
				>
			{/if}
		</div>
	</div>
{:else if !consentGiven}
	<div class="flex items-center justify-center py-10">
		<div class="card max-w-lg w-full p-8 text-center space-y-6">
			<div class="icon-circle-primary w-16 h-16 flex items-center justify-center mx-auto">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
			</div>
			<h2 class="text-2xl font-black text-(--text-primary)">Persetujuan Ujian</h2>
			{#if d.examRoom}
				<p class="text-sm font-black text-primary-500">{d.examRoom.exam?.name ?? 'Ujian'}</p>
			{/if}
			{#if endTime}
				<p class="text-sm font-medium text-(--text-secondary)">
					Berakhir: <strong class="font-black text-(--text-primary)"
						>{endTime.toLocaleString('id-ID', WIB)}</strong
					>
				</p>
			{/if}
			<div
				class="text-sm font-medium text-(--text-secondary) leading-relaxed text-left space-y-2 border-2 border-(--nb-border) p-4 bg-(--bg-secondary)"
			>
				<p class="font-black text-(--text-primary) text-sm mb-2">
					Selama ujian berlangsung, hal berikut <span class="text-red-600">DILARANG:</span>
				</p>
				<ul class="space-y-1 text-xs">
					<li>⚠️ Klik kanan / membuka menu konteks</li>
					<li>⚠️ Menyalin atau menempel teks (Ctrl+C / Ctrl+V)</li>
					<li>⚠️ Berpindah tab, jendela, atau minimize browser</li>
					<li>⚠️ Membuka DevTools (F12 / Ctrl+Shift+I)</li>
					<li>⚠️ Mencetak halaman (Ctrl+P)</li>
					<li>⚠️ Screenshot (PrintScreen)</li>
					<li>⚠️ Merekam layar</li>
					<li>⚠️ Menyeret (drag) konten halaman</li>
				</ul>
				<p class="text-xs font-bold text-red-600 mt-2">
					Setiap pelanggaran akan <strong>mengunci ujian Anda secara otomatis</strong> dan membutuhkan
					persetujuan pengawas.
				</p>
			</div>
			{#if questions.length === 0}
				<div class="warning-box p-3 text-sm font-bold">
					Belum ada soal tersedia untuk ujian ini.
				</div>
			{/if}
			<div class="pt-2 flex gap-4 w-full">
				<a href="/participant/exams" class="btn-secondary flex-1 text-center">Batal</a>
				<button onclick={() => (consentGiven = true)} class="btn-primary flex-1"
					>Saya Mengerti &amp; Siap</button
				>
			</div>
		</div>
	</div>
{:else if !examStarted}
	<div class="flex items-center justify-center py-16">
		<div class="card-warning max-w-md w-full p-8 text-center space-y-6">
			<div class="icon-circle-warning w-16 h-16 flex items-center justify-center mx-auto">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<h2 class="text-2xl font-black text-(--text-primary)">Menunggu Ujian Dimulai</h2>
			{#if startTime}
				<p class="text-sm font-medium text-(--text-secondary)">
					Ujian dimulai pada: <strong class="font-black text-amber-600"
						>{startTime.toLocaleString('id-ID', WIB)}</strong
					>
				</p>
			{/if}
			<div class="flex items-center justify-center gap-2 text-sm font-medium text-amber-600">
				<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				Menunggu jadwal ujian...
			</div>
		</div>
	</div>
{:else if isLocked}
	<div class="flex items-center justify-center py-16">
		<div
			class="card max-w-lg w-full p-8 text-center space-y-6"
			style="border-color: #ef4444; box-shadow: 6px 6px 0 0 #ef4444;"
		>
			<div
				class="w-20 h-20 flex items-center justify-center mx-auto border-2 border-red-500 bg-red-50 dark:bg-red-950 rounded-md animate-pulse"
			>
				<svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			</div>
			<h2 class="text-2xl font-black text-red-600">Ujian Terkunci!</h2>
			<p class="text-sm font-medium text-(--text-secondary)">
				{lockReason || 'Sistem mendeteksi adanya pelanggaran aturan ujian.'}
			</p>
			<p class="text-sm font-bold text-red-600">
				Silakan hubungi Pengawas Ruangan untuk meminta akses kembali.
			</p>
		</div>
	</div>
{:else if showSubmitModal}
	<div class="flex items-center justify-center py-16">
		<div class="card-warning max-w-md w-full p-8 text-center space-y-5">
			<div class="icon-circle-warning w-16 h-16 flex items-center justify-center mx-auto">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			</div>
			<h2 class="text-xl font-black text-(--text-primary)">Kumpulkan Ujian?</h2>
			<p class="text-sm font-medium text-(--text-secondary)">
				Anda telah menjawab <strong class="font-black text-(--text-primary)">{answeredCount}</strong
				>
				dari
				<strong class="font-black text-(--text-primary)">{questions.length}</strong> soal.
			</p>
			<div class="flex gap-3 pt-2">
				<button
					onclick={() => (showSubmitModal = false)}
					class="btn-secondary flex-1"
					disabled={submitting}>Kembali</button
				>
				<button onclick={submitExam} class="btn-primary flex-1" disabled={submitting}
					>Kumpulkan</button
				>
			</div>
		</div>
	</div>
{:else}
	<div class="space-y-4">
		<div class="card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
			<div class="flex items-center gap-3 min-w-0">
				<h1 class="text-base font-black text-(--text-primary) truncate">
					{d.examRoom?.exam?.name ?? 'Ujian'}
				</h1>
				<span class="badge shrink-0 text-xs font-black"
					>{currentQuestionIndex + 1} / {questions.length}</span
				>
			</div>
			<div class="flex items-center gap-3 shrink-0 flex-wrap">
				{#if timeLeft}
					<div
						class="flex items-center gap-1.5 px-3 py-1 text-sm font-mono font-black {timeLeft <
						'00:10:00'
							? 'timer-badge-warn'
							: 'timer-badge'}"
					>
						{timeLeft}
					</div>
				{/if}
				<span class="text-xs font-medium text-(--text-secondary)"
					>{answeredCount}/{questions.length} dijawab</span
				>
				<button
					class="btn-primary text-sm"
					onclick={() => (showSubmitModal = true)}
					disabled={submitting}
				>
					{submitting ? 'Mengumpulkan...' : 'Kumpulkan'}
				</button>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
			<div class="lg:col-span-3">
				{#if currentQuestion}
					{@const q = currentQuestion.question}
					{@const isSaving = savingQuestions.has(q?.id ?? '')}
					<div class="card p-6 sm:p-8 space-y-6">
						<div class="flex items-start gap-3">
							<span
								class="shrink-0 w-8 h-8 flex items-center justify-center text-sm font-black text-white bg-primary-500 border-2 border-(--nb-border)"
							>
								{currentQuestion.questionNumber}
							</span>
							<p class="text-base font-medium text-(--text-primary) leading-relaxed flex-1">
								{q?.text ?? '—'}
							</p>
							{#if isSaving}
								<svg
									class="animate-spin h-4 w-4 text-(--text-secondary) shrink-0 mt-1"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{/if}
						</div>

						{#if q?.type === 'MULTIPLE_CHOICE' && q.options && q.options.length > 0}
							<div class="space-y-3">
								{#each q.options as opt, idx}
									<ExamOption
										label={String.fromCharCode(65 + idx)}
										text={opt.text}
										selected={selectedOptions[q.id] === opt.id}
										onclick={() => selectOption(q.id, opt.id)}
									/>
								{/each}
							</div>
						{:else if q?.type === 'ESSAY'}
							{@const isDirty = essayDirty.has(q.id)}
							<textarea
								class="input-field resize-none h-40"
								placeholder="Tulis jawaban Anda di sini..."
								value={essayTexts[q.id] ?? ''}
								oninput={(e) => onEssayInput(q.id, (e.currentTarget as HTMLTextAreaElement).value)}
							></textarea>
							<p class="text-xs font-medium text-(--text-secondary) flex items-center gap-1">
								{#if isDirty}
									<span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
									Mengetik...
								{:else if offlineQueue.has(q.id)}
									<span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
									Menunggu Koneksi...
								{:else if essayTexts[q.id]?.trim()}
									<span class="inline-block w-2 h-2 rounded-full bg-green-500"></span>
									Tersimpan
								{:else}
									Jawaban disimpan otomatis.
								{/if}
							</p>
						{:else}
							<p class="text-sm font-medium text-(--text-secondary)">Soal tidak tersedia.</p>
						{/if}

						<div class="flex justify-between gap-3 pt-2 border-t-2 border-(--nb-border)">
							<button
								class="btn-secondary"
								disabled={currentQuestionIndex === 0}
								onclick={() => currentQuestionIndex--}>← Sebelumnya</button
							>
							<button
								class="btn-primary"
								disabled={currentQuestionIndex === questions.length - 1}
								onclick={() => currentQuestionIndex++}>Selanjutnya →</button
							>
						</div>
					</div>
				{:else}
					<div class="card p-8 text-center font-bold text-(--text-secondary)">
						Tidak ada soal tersedia.
					</div>
				{/if}

				<button
					class="mt-3 w-full btn-secondary text-sm gap-2 lg:hidden"
					onclick={() => (showMobileNav = !showMobileNav)}
				>
					{showMobileNav ? 'Sembunyikan Navigasi' : 'Tampilkan Navigasi Soal'}
				</button>

				{#if showMobileNav}
					<div class="mt-3 card p-4 lg:hidden">
						<h3 class="text-xs font-black text-(--text-primary) uppercase tracking-wider mb-3">
							Navigasi Soal
						</h3>
						<div class="grid grid-cols-8 gap-1.5">
							{#each questions as q, idx}
								{@const qId = q.question?.id ?? ''}
								{@const answered = !!(selectedOptions[qId] || essayTexts[qId]?.trim())}
								{@const dirty = essayDirty.has(qId)}
								<button
									class="h-9 w-full flex items-center justify-center text-xs font-black relative {currentQuestionIndex ===
									idx
										? 'nav-btn-current'
										: answered
											? 'nav-btn-answered'
											: 'nav-btn'}"
									onclick={() => {
										currentQuestionIndex = idx;
										showMobileNav = false;
									}}
								>
									{idx + 1}
									{#if dirty || offlineQueue.has(qId)}<span
											class="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full {offlineQueue.has(qId) ? 'bg-red-500' : 'bg-amber-400'}"
										></span>{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<aside class="hidden lg:flex flex-col card p-4 sticky top-4">
				<h3 class="text-xs font-black text-(--text-primary) uppercase tracking-wider mb-3">
					Navigasi Soal
				</h3>
				<div class="grid grid-cols-5 gap-1.5">
					{#each questions as q, idx}
						{@const qId = q.question?.id ?? ''}
						{@const answered = !!(selectedOptions[qId] || essayTexts[qId]?.trim())}
						{@const dirty = essayDirty.has(qId)}
						<button
							class="h-9 w-full flex items-center justify-center text-xs font-black relative {currentQuestionIndex ===
							idx
								? 'nav-btn-current'
								: answered
									? 'nav-btn-answered'
									: 'nav-btn'}"
							onclick={() => (currentQuestionIndex = idx)}
						>
							{idx + 1}
							{#if dirty || offlineQueue.has(qId)}<span
									class="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full {offlineQueue.has(qId) ? 'bg-red-500' : 'bg-amber-400'}"
								></span>{/if}
						</button>
					{/each}
				</div>
			</aside>
		</div>
	</div>
{/if}
