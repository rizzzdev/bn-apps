<script lang="ts">
	import { Icon, Button } from '../atoms';
	import Modal from './modal.svelte';
	
	type ModalType = 'warning'|'danger'|'info';
	let { show = $bindable(false), title = 'Konfirmasi', message, type = 'warning', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', onConfirm } = $props<{ show: boolean, title?: string, message: string, type?: ModalType, confirmText?: string, cancelText?: string, onConfirm: () => void }>();
	
	const typeConfig: Record<ModalType, {icon: string, color: string}> = {
		warning: { icon: 'warning', color: 'text-warning' },
		danger: { icon: 'error', color: 'text-error' },
		info: { icon: 'info', color: 'text-primary' }
	};
	
	function handleConfirm() {
		show = false;
		onConfirm();
	}
</script>

<Modal bind:show {title}>
	<div class="flex flex-col items-center text-center space-y-4 py-4">
		<Icon name={typeConfig[type as ModalType].icon} class="text-6xl {typeConfig[type as ModalType].color} drop-shadow-[2px_2px_0px_#0f172a]" />
		<p class="font-mono text-lg font-bold">{message}</p>
	</div>
	
	<div class="flex gap-4 mt-6">
		<Button variant="secondary" class="flex-1 w-full" onclick={() => show = false}>
			{cancelText}
		</Button>
		<Button variant={type === 'danger' ? 'error' : 'primary'} class="flex-1 w-full" onclick={handleConfirm}>
			{confirmText}
		</Button>
	</div>
</Modal>
