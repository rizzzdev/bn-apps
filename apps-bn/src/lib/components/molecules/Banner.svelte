<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		badgeText = 'SISTEM INFORMASI AKADEMIK TERPADU (SSO)',
		title,
		description,
		icon = 'school',
		variant = 'primary',
		actionButtons,
		className = ''
	}: {
		badgeText?: string;
		title: string;
		description: string;
		icon?: string;
		variant?: 'primary' | 'secondary' | 'tertiary';
		actionButtons?: Snippet;
		className?: string;
	} = $props();

	const variantAccents = {
		primary: 'from-secondary-fixed via-primary-container to-tertiary-container',
		secondary: 'from-secondary-fixed via-secondary-container to-primary-container',
		tertiary: 'from-tertiary-container via-secondary-fixed to-primary-container'
	};
</script>

<div class="mb-4 flex w-full flex-col gap-3 md:mb-6 {className}">
	<!-- Optional Action Buttons Slot (Top Right Row) -->
	{#if actionButtons}
		<div class="flex w-full items-center justify-end gap-2">
			{@render actionButtons()}
		</div>
	{/if}

	<!-- Beautiful Neobrutal Banner Container -->
	<div
		class="neo-border neo-shadow relative box-border w-full overflow-hidden rounded-xl bg-surface-container p-5 transition-all duration-300 md:rounded-2xl md:p-6 lg:p-7"
	>
		<!-- Decorative Top Accent Stripe -->
		<div class="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r {variantAccents[variant]}"></div>

		<!-- Main Banner Content -->
		<div class="relative z-10 max-w-3xl">
			{#if badgeText}
				<div
					class="mb-2.5 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-secondary-fixed px-2.5 py-1 font-label-bold text-[10px] tracking-wider text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:text-xs"
				>
					<span class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-black"></span>
					</span>
					{badgeText}
				</div>
			{/if}

			<h1
				class="mb-2 font-headline-lg text-xl leading-tight font-extrabold tracking-tight break-words text-on-surface uppercase md:text-2xl lg:text-3xl"
			>
				{title}
			</h1>

			<p class="max-w-2xl font-body-md text-xs leading-relaxed text-on-surface-variant md:text-sm">
				{description}
			</p>
		</div>

		<!-- Decorative Material Icon Watermark Background -->
		<div
			class="pointer-events-none absolute -right-3 -bottom-3 z-0 hidden opacity-10 mix-blend-multiply select-none sm:block"
		>
			<span
				class="material-symbols-outlined text-[100px] text-black md:text-[130px] lg:text-[150px]"
			>
				{icon}
			</span>
		</div>
	</div>
</div>
