<script lang="ts">
	import { toast, type ToastItem } from '$lib/stores/toast';

	let items = $state<ToastItem[]>([]);

	toast.subscribe((value) => {
		items = value;
	});

	const getVariantStyles = (type: string) => {
		switch (type) {
			case 'success':
				return {
					bg: 'bg-[#22c55e] text-black',
					icon: 'check_circle',
					bar: 'bg-black'
				};
			case 'error':
				return {
					bg: 'bg-[#ff5449] text-white',
					icon: 'error',
					bar: 'bg-white'
				};
			case 'warning':
				return {
					bg: 'bg-[#f59e0b] text-black',
					icon: 'warning',
					bar: 'bg-black'
				};
			case 'info':
			default:
				return {
					bg: 'bg-[#38bdf8] text-black',
					icon: 'info',
					bar: 'bg-black'
				};
		}
	};
</script>

<div
	class="pointer-events-none fixed top-5 right-5 z-[9999] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0"
>
	{#each items as item (item.id)}
		{@const style = getVariantStyles(item.type)}
		<div
			class="neo-shadow pointer-events-auto relative flex translate-y-0 transform items-start gap-3 overflow-hidden rounded-xl border-3 border-black p-4 opacity-100 transition-all duration-300 {style.bg}"
			role="alert"
		>
			<span class="material-symbols-outlined mt-0.5 shrink-0 text-2xl select-none"
				>{style.icon}</span
			>

			<div class="flex-1 pr-6">
				{#if item.title}
					<h4 class="mb-0.5 font-label-bold text-sm tracking-wide uppercase">{item.title}</h4>
				{/if}
				<p class="font-body-md text-xs leading-snug break-words md:text-sm">{item.message}</p>
			</div>

			<button
				type="button"
				onclick={() => toast.remove(item.id)}
				class="absolute top-2.5 right-2.5 flex cursor-pointer items-center justify-center rounded-md border border-transparent p-1 transition-colors hover:border-black/30 hover:bg-black/10 active:bg-black/20"
				aria-label="Tutup"
			>
				<span class="material-symbols-outlined text-base">close</span>
			</button>

			{#if (item.duration || 0) > 0}
				<div class="absolute right-0 bottom-0 left-0 h-1 overflow-hidden bg-black/15">
					<div
						class="h-full {style.bar} animate-toast-progress opacity-60"
						style="animation-duration: {item.duration}ms;"
					></div>
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	@keyframes toast-progress {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}

	.animate-toast-progress {
		animation-name: toast-progress;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}
</style>
