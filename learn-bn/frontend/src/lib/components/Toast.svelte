<script lang="ts">
	import { toast, type ToastMessage, type ToastType } from '$lib/features/toast/toast.svelte';

	const iconMap: Record<ToastType, string> = {
		info: 'info',
		success: 'check_circle',
		warning: 'warning',
		error: 'error',
	};

	const colorMap: Record<ToastType, { bg: string; text: string; icon: string; close: string }> = {
		info: { bg: 'bg-[#2196F3]', text: 'text-white', icon: 'text-white', close: 'text-white/70 hover:text-white' },
		success: { bg: 'bg-[#4CAF50]', text: 'text-white', icon: 'text-white', close: 'text-white/70 hover:text-white' },
		warning: { bg: 'bg-[#FF9800]', text: 'text-black', icon: 'text-black', close: 'text-black/60 hover:text-black' },
		error: { bg: 'bg-[#F44336]', text: 'text-white', icon: 'text-white', close: 'text-white/70 hover:text-white' },
	};
</script>

{#if toast.toasts.length > 0}
	<div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
		{#each toast.toasts as t (t.id)}
			{@const colors = colorMap[t.type]}
			<div
				class="pointer-events-auto {colors.bg} border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex items-start gap-3 animate-slide-in"
				role="alert"
			>
				<span class="material-symbols-outlined {colors.icon} text-xl shrink-0" style="font-variation-settings: 'FILL' 1;">
					{iconMap[t.type]}
				</span>
				<p class="font-label-bold text-sm {colors.text} flex-1">{t.message}</p>
				<button
					onclick={() => toast.remove(t.id)}
					class="{colors.close} cursor-pointer shrink-0"
					aria-label="Tutup"
				>
					<span class="material-symbols-outlined text-base">close</span>
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes slide-in {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	:global(.animate-slide-in) {
		animation: slide-in 0.25s ease-out;
	}
</style>
