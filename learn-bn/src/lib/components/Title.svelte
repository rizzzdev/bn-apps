<script lang="ts">
	let { class: className = '' } = $props<{ class?: string }>();
</script>

<a href="/" class="group flex items-center gap-2 md:gap-3 hover:opacity-90 transition-opacity w-max {className}">
	<div class="w-8 h-8 md:w-10 md:h-10 bg-primary-container neo-border flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] rotate-3 group-hover:rotate-6 transition-transform">
		<span class="material-symbols-outlined text-lg md:text-2xl" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
	</div>
	<h1 class="font-display-lg text-xl md:text-2xl text-on-surface uppercase tracking-tight font-black pt-1">Learn-BN</h1>
</a>
