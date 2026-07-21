<script lang="ts">
	import { toasts } from '$lib/stores/toast';

	const icon: Record<string, string> = {
		success: 'M5 13l4 4L19 7',
		error: 'M6 18L18 6M6 6l12 12',
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
	};

	const iconColor: Record<string, string> = {
		success: '#16a34a',
		error: '#ffffff',
		info: '#2563eb'
	};
</script>

<div class="fixed bottom-5 right-5 flex flex-col gap-2 z-9999 pointer-events-none">
	{#each $toasts as toast (toast.id)}
		<div
			class="pointer-events-auto flex items-center gap-2.5 p-4 w-89 text-[13px] font-bold animate-slide-in {toast.type ===
			'error'
				? 'toast-error'
				: 'toast-base'}"
		>
			<svg
				class="w-4 h-4 shrink-0"
				fill="none"
				stroke={iconColor[toast.type] ?? iconColor.info}
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d={icon[toast.type] ?? icon.info}
				/>
			</svg>
			<span class="flex-1 leading-snug">{toast.message}</span>
		</div>
	{/each}
</div>

<style>
	@keyframes slide-in {
		from {
			transform: translateX(120%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
	.animate-slide-in {
		animation: slide-in 0.15s ease-out;
	}
</style>
