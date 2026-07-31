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

<div class="w-full flex flex-col gap-3 mb-4 md:mb-6 {className}">
	<!-- Optional Action Buttons Slot (Top Right Row) -->
	{#if actionButtons}
		<div class="flex justify-end items-center gap-2 w-full">
			{@render actionButtons()}
		</div>
	{/if}

	<!-- Beautiful Neobrutal Banner Container -->
	<div
		class="relative overflow-hidden bg-surface-container neo-border neo-shadow p-5 md:p-6 lg:p-7 rounded-xl md:rounded-2xl transition-all duration-300 w-full box-border"
	>
		<!-- Decorative Top Accent Stripe -->
		<div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r {variantAccents[variant]}"></div>

		<!-- Main Banner Content -->
		<div class="relative z-10 max-w-3xl">
			{#if badgeText}
				<div
					class="inline-flex items-center gap-2 px-2.5 py-1 bg-secondary-fixed text-black border-2 border-black rounded-lg text-[10px] md:text-xs font-label-bold mb-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider"
				>
					<span class="relative flex h-2 w-2">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
					</span>
					{badgeText}
				</div>
			{/if}

			<h1 class="font-headline-lg text-on-surface mb-2 uppercase tracking-tight text-xl md:text-2xl lg:text-3xl leading-tight font-extrabold break-words">
				{title}
			</h1>

			<p class="font-body-md text-on-surface-variant text-xs md:text-sm leading-relaxed max-w-2xl">
				{description}
			</p>
		</div>

		<!-- Decorative Material Icon Watermark Background -->
		<div class="absolute -right-3 -bottom-3 opacity-10 pointer-events-none hidden sm:block z-0 mix-blend-multiply select-none">
			<span class="material-symbols-outlined text-[100px] md:text-[130px] lg:text-[150px] text-black">
				{icon}
			</span>
		</div>
	</div>
</div>
