<script lang="ts">
	import { Button, Icon } from '$lib/components/atoms';
	import { Modal } from '$lib/components/molecules';

	let {
		isOpen = $bindable(false),
		title = 'Konfirmasi',
		message = 'Apakah Anda yakin?',
		confirmText = 'Ya',
		cancelText = 'Batal',
		type = 'danger',
		onConfirm
	} = $props<{
		isOpen?: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		type?: 'danger' | 'warning' | 'info';
		onConfirm?: () => void;
	}>();

	let confirmVariant = $derived((type === 'danger' ? 'danger' : 'primary') as 'danger' | 'primary');
	let iconName = $derived(type === 'danger' ? 'warning' : type === 'warning' ? 'error' : 'info');
</script>

<Modal bind:isOpen {title}>
	<div class="flex flex-col items-center gap-4 py-4">
		<Icon name={iconName} size="48px" class="text-error" fill={true} />
		<p class="font-body-md text-body-md text-center text-on-surface">{message}</p>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isOpen = false)} class="min-w-[100px]">{cancelText}</Button>
		<Button variant={confirmVariant} onclick={onConfirm} class="min-w-[100px]">{confirmText}</Button>
	{/snippet}
</Modal>
