<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';

	let {
		participant,
		examStatus,
		canUnlock = true,
		onUnlock,
		onWarn,
		onMonitor
	}: {
		participant: {
			userId: string;
			username: string;
			fullname: string;
			isLocked: boolean;
			violationCount: number;
			lastViolationType: string | null;
			isOnline: boolean;
		};
		examStatus: string;
		canUnlock?: boolean;
		onUnlock: (userId: string) => void;
		onWarn?: (userId: string, fullname: string) => void;
		onMonitor?: (userId: string) => void;
	} = $props();
</script>

<div
	class="p-4 {participant.isLocked
		? 'card-danger'
		: !participant.isOnline
			? 'card bg-(--bg-secondary)'
			: 'card'}"
>
	<div class="flex justify-between items-start mb-2">
		<div class="min-w-0">
			<h3 class="font-black text-(--text-primary) truncate">{participant.fullname}</h3>
			<p class="text-xs font-medium text-(--text-secondary)">{participant.username}</p>
			{#if participant.violationCount > 0}
				<p class="text-xs font-black mt-0.5 text-amber-600">
					{participant.violationCount}× pelanggaran
				</p>
			{/if}
		</div>
		<div class="shrink-0 ml-2">
			{#if participant.isLocked}
				<Badge variant="danger" class="font-black">Terkunci</Badge>
			{:else if !participant.isOnline}
				<Badge class="font-black">Terputus</Badge>
			{:else}
				<Badge variant="success" class="font-black">Normal</Badge>
			{/if}
		</div>
	</div>

	{#if participant.isLocked}
		<div class="mt-3 p-3 text-sm danger-box">
			<p class="font-black text-xs uppercase tracking-wide mb-1">Pelanggaran:</p>
			<p class="font-medium">{participant.lastViolationType ?? '-'}</p>
		</div>
		{#if examStatus !== 'ENDED'}
			{#if canUnlock}
				<button
					class="btn-danger mt-3 w-full text-xs font-black"
					onclick={() => onUnlock(participant.userId)}
				>
					Buka Kunci
				</button>
			{:else}
				<p
					class="mt-3 p-2 text-xs font-bold text-center text-red-600 bg-red-50 dark:bg-red-950 border-2 border-red-300"
				>
					Melebihi batas pelanggaran — hanya admin yang dapat membuka kunci.
				</p>
			{/if}
		{/if}
	{/if}

	{#if examStatus === 'ONGOING' && onWarn}
		<div class="mt-2 flex flex-col gap-2 w-full">
			{#if onMonitor}
				<button
					class="text-xs font-black btn-primary flex-1"
					onclick={() => onMonitor(participant.userId)}
				>
					Pantau Jawaban
				</button>
			{/if}
			<button
				class="text-xs font-black btn-secondary flex-1"
				onclick={() => onWarn!(participant.userId, participant.fullname)}
			>
				Kirim Peringatan
			</button>
		</div>
	{/if}
</div>
