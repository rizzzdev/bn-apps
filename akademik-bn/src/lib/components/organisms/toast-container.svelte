<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import { toast } from '$lib/stores/toast.svelte';

	const toastMessages = $derived(toast.toasts);

	function removeToast(id: string) {
		toast.remove(id);
	}
</script>

{#if toastMessages.length > 0}
	<div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-sm">
		{#each toastMessages as t (t.id)}
			<div
				class="neo-border neo-shadow-sm p-4 flex items-start gap-3 animate-slide-in {t.type ===
				'success'
					? 'bg-secondary-fixed text-on-secondary-fixed'
					: t.type === 'error'
						? 'bg-error-container text-on-error-container'
						: 'bg-surface text-on-surface'}"
			>
				<Icon
					name={t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
					size="20px"
					fill={true}
				/>
				<p class="font-body-md text-body-md flex-1">{t.message}</p>
				<button onclick={() => removeToast(t.id)} class="hover:opacity-70 transition-opacity">
					<Icon name="close" size="16px" />
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
	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}
</style>
