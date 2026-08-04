<script lang="ts">
	import Modal from '$lib/components/modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		show = false,
		title = 'Konfirmasi',
		message = 'Apakah Anda yakin ingin melanjutkan?',
		confirmText = 'Hapus',
		cancelText = 'Batal',
		variant = 'danger',
		onConfirm,
		onCancel
	}: {
		show?: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'primary-outline' | 'danger-outline';
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();
</script>

<Modal {show} onClose={onCancel}>
	<h2 class="text-lg font-black text-(--text-primary) mb-4">{title}</h2>
	<p class="text-(--text-secondary) mb-6">{message}</p>
	<div class="flex justify-end gap-3 pt-2">
		<Button variant="secondary" onclick={onCancel}>{cancelText}</Button>
		<Button {variant} onclick={onConfirm}>{confirmText}</Button>
	</div>
</Modal>
