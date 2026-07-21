<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Title } from '$lib/components/atoms';

	let { children } = $props<{ children?: Snippet }>();
</script>

<div class="min-h-screen bg-secondary-fixed bg-[linear-gradient(to_right,#0000001a_1px,transparent_1px),linear-gradient(to_bottom,#0000001a_1px,transparent_1px)] bg-[size:32px_32px] flex flex-col items-center justify-center p-lg gap-xl relative overflow-hidden w-full">
	
	<!-- Eye-catching Decorative Shapes -->
	<!-- Giant Yellow Circle -->
	<div class="absolute -top-16 -left-16 w-56 h-56 bg-[#FCD34D] border-4 border-on-background rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-0 hidden sm:block transition-transform hover:scale-105 duration-500"></div>
	
	<!-- Bold Blue Rectangle -->
	<div class="absolute bottom-12 -right-6 w-48 h-32 bg-secondary border-4 border-on-background shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] rotate-12 z-0 hidden md:block transition-transform hover:rotate-0 duration-300"></div>
	
	<!-- Spinning Red Diamond -->
	<div class="absolute top-24 right-20 w-16 h-16 bg-error border-4 border-on-background shadow-neo-sm z-0 animate-[spin_8s_linear_infinite] hidden sm:block"></div>
	
	<!-- Floating White Pill -->
	<div class="absolute bottom-24 left-16 w-32 h-12 bg-surface border-4 border-on-background shadow-neo -rotate-12 rounded-full z-0 hidden md:block"></div>
	
	<!-- Bouncing Accent Dot -->
	<div class="absolute top-1/2 left-10 w-8 h-8 bg-error-container border-3 border-on-background rounded-full z-0 animate-bounce hidden xl:block"></div>

	<!-- Top Title Logo -->
	<div class="relative z-10">
		<div class="bg-surface px-xl py-sm rounded-full border-4 border-on-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[-3deg] inline-block hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer">
			<Title class="text-[44px] leading-none" />
		</div>
	</div>

	<!-- Auth Form -->
	<div class="w-full max-w-[480px] bg-surface border-4 border-on-background rounded-2xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-lg flex flex-col gap-md z-10 relative transition-transform hover:-translate-y-1 duration-300">
		{@render children?.()}
	</div>
</div>
