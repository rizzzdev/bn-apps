<script lang="ts">
	let {
		size = 32,
		showText = true,
		textClass = ''
	}: {
		size?: number;
		showText?: boolean;
		textClass?: string;
	} = $props();
</script>

<div class="flex items-center gap-2.5">
	<div
		class="logo-box shrink-0 flex items-center justify-center overflow-hidden"
		style="width: {size}px; height: {size}px;"
	>
		<svg
			width={size}
			height={size}
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<!-- Paper shape -->
			<rect x="5" y="3" width="17" height="22" fill="white" fill-opacity="0.2" />
			<!-- Folded corner -->
			<polygon points="22,3 22,9 28,9" fill="white" fill-opacity="0.15" />
			<!-- Bold checkmark -->
			<path
				d="M7 17 L13 23 L25 8"
				stroke="white"
				stroke-width="4"
				stroke-linecap="round"
				stroke-linejoin="round"
				fill="none"
			/>
		</svg>
	</div>
	{#if showText}
		<span class="font-black tracking-tight text-(--text-primary) {textClass}">Exam-BN</span>
	{/if}
</div>
