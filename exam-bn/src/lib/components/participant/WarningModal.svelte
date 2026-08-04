<script lang="ts">
	import { warnings, dismissWarning } from '$lib/stores/warnings';

	const warning = $derived($warnings[0]);

	function formatTime(date: Date): string {
		return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}
</script>

{#if warning}
	<div class="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
		<div
			class="bg-(--nb-card-bg) max-w-md w-full p-8 text-center space-y-5"
			style="border: 3px solid #f59e0b; box-shadow: 6px 6px 0 0 #f59e0b;"
		>
			<div class="flex justify-center">
				<div
					class="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center animate-pulse"
				>
					<svg
						class="w-9 h-9 text-amber-500"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
						/>
					</svg>
				</div>
			</div>

			<div>
				<h2 class="font-black text-amber-600 text-xl">Peringatan dari Pengawas</h2>
				<p class="text-xs text-(--text-secondary) mt-1">Dari: {warning.fromName}</p>
			</div>

			<div
				class="border-2 border-amber-200 bg-amber-50 p-4 dark:bg-amber-950 dark:border-amber-800"
			>
				<p class="text-base font-medium text-(--text-primary) leading-relaxed">{warning.message}</p>
			</div>

			<p class="text-xs text-(--text-secondary)">{formatTime(warning.timestamp)}</p>

			<button class="btn-primary w-full" onclick={() => dismissWarning(warning.id)}>
				Saya Mengerti
			</button>
		</div>
	</div>
{/if}
