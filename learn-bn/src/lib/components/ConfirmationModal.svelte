<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	let {
		open = $bindable(false),
		title = 'Konfirmasi',
		message = 'Apakah Anda yakin?',
		confirmText = 'Ya, Lanjutkan',
		cancelText = 'Batal',
		variant = 'primary' as 'primary' | 'error' | 'warning',
		loading = false,
		icon = 'help',
		onconfirm,
		oncancel,
	}: {
		open: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'primary' | 'error' | 'warning';
		loading?: boolean;
		icon?: string;
		onconfirm?: () => void;
		oncancel?: () => void;
	} = $props();

	const variantStyles: Record<string, { iconBg: string; iconColor: string; btnVariant: string }> = {
		primary: { iconBg: 'bg-primary/20', iconColor: 'text-primary', btnVariant: 'primary' },
		error: { iconBg: 'bg-error/20', iconColor: 'text-error', btnVariant: 'error' },
		warning: { iconBg: 'bg-warning/20', iconColor: 'text-warning', btnVariant: 'primary' },
	};

	let styles = $derived(variantStyles[variant] || variantStyles.primary);

	function handleConfirm() {
		onconfirm?.();
	}

	function handleCancel() {
		open = false;
		oncancel?.();
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4"
		onclick={handleBackdrop}
	>
		<div class="bg-surface-container-lowest neo-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full flex flex-col gap-5 animate-scale-in">
			<!-- Icon & Title -->
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 {styles.iconBg} neo-border flex items-center justify-center shrink-0">
					<span class="material-symbols-outlined {styles.iconColor} text-2xl" style="font-variation-settings: 'FILL' 1;">
						{icon}
					</span>
				</div>
				<div>
					<h4 class="font-headline-md text-xl font-black text-on-surface">{title}</h4>
				</div>
			</div>

			<!-- Message -->
			<p class="font-body-md text-on-surface/80 leading-relaxed">{message}</p>

			<!-- Actions -->
			<div class="flex justify-end items-center gap-3 pt-2 border-t-2 border-on-surface/20">
				<Button variant="outline" size="sm" disabled={loading} onclick={handleCancel}>
					{cancelText}
				</Button>
				<Button variant={variant === 'error' ? 'error' : 'primary'} size="sm" disabled={loading} onclick={handleConfirm}>
					{#if loading}
						<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
					{/if}
					{confirmText}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes scale-in {
		from {
			transform: scale(0.9);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	:global(.animate-scale-in) {
		animation: scale-in 0.15s ease-out;
	}
</style>
