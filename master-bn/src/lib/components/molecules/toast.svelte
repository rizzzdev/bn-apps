<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import type { ToastMessage, ToastType } from '$lib/stores/toast.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { fly } from 'svelte/transition';

	let { data } = $props<{ data: ToastMessage }>();

	const variantStyles: Record<ToastType, string> = {
		success: 'bg-[#A3E635] text-on-surface',
		error: 'bg-error text-on-error',
		warning: 'bg-[#FCD34D] text-on-surface',
		info: 'bg-secondary text-on-secondary'
	};

	const icons: Record<ToastType, string> = {
		success: 'check_circle',
		error: 'warning',
		warning: 'info',
		info: 'notifications'
	};
</script>

<div
	transition:fly={{ x: 50, duration: 200 }}
	class="border-on-background w-full md:w-80 border-3 rounded-lg shadow-neo-sm flex items-center p-sm gap-sm {variantStyles[
		data.type as ToastType
	]}"
	role="alert"
>
	<Icon name={icons[data.type as ToastType]} class="text-2xl" />
	<p class="font-body-bold text-label-sm flex-1">{data.message}</p>
	<button
		onclick={() => toast.remove(data.id)}
		class="hover:opacity-70 transition-opacity flex items-center justify-center p-1 cursor-pointer"
		aria-label="Tutup"
	>
		<Icon name="close" class="text-lg" />
	</button>
</div>
