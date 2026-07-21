<script lang="ts">
	import { Modal } from '$lib/components/molecules';
	import { Button, Icon } from '$lib/components/atoms';

	let {
		isOpen = $bindable(false),
		title = 'Konfirmasi',
		message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
		confirmText = 'Ya, Lanjutkan',
		cancelText = 'Batal',
		type = 'warning', // 'warning', 'danger', 'info'
		onConfirm,
		onCancel
	} = $props<{
		isOpen?: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		type?: 'warning' | 'danger' | 'info';
		onConfirm?: () => void;
		onCancel?: () => void;
	}>();

	function handleConfirm() {
		onConfirm?.();
		isOpen = false;
	}

	function handleCancel() {
		onCancel?.();
		isOpen = false;
	}
</script>

<Modal bind:isOpen {title}>
	<div class="flex items-start gap-md">
		<div class="p-xs border-on-background border-3 rounded-lg shadow-neo-xs mt-1 {type === 'danger' ? 'bg-error text-on-error' : type === 'warning' ? 'bg-[#FCD34D] text-on-surface' : 'bg-secondary text-on-secondary'}">
			<Icon name={type === 'danger' ? 'warning' : type === 'warning' ? 'info' : 'help'} class="text-2xl" />
		</div>
		<p class="font-body-base text-body-base text-on-surface-variant flex-1">
			{message}
		</p>
	</div>

	{#snippet footer()}
		<Button variant="secondary" onclick={handleCancel} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">
			{cancelText}
		</Button>
		<Button variant={type === 'danger' ? 'error' : type === 'warning' ? 'warning' : 'info'} onclick={handleConfirm}>
			{confirmText}
		</Button>
	{/snippet}
</Modal>
