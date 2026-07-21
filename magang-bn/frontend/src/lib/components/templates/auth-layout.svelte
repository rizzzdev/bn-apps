<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children } = $props<{ children: Snippet }>();
</script>

<div class="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-surface text-on-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
	
	<!-- Ornamen Industrial Neo-Brutalist -->
	<div class="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center z-0">
		<div class="font-headline font-black text-[12vw] text-on-background opacity-5 whitespace-nowrap -rotate-12 select-none tracking-tighter">
			MAGANG-BN
		</div>
	</div>
	
	<!-- Crosshairs -->
	<div class="hidden md:block fixed top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-on-background pointer-events-none z-0"></div>
	<div class="hidden md:block fixed top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-on-background pointer-events-none z-0"></div>
	<div class="hidden md:block fixed bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-on-background pointer-events-none z-0"></div>
	<div class="hidden md:block fixed bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-on-background pointer-events-none z-0"></div>

	<main class="w-full max-w-[448px] animate-fade-in-up relative z-10 flex flex-col items-center">
		<div class="text-center mb-8 bg-surface p-4 border-4 border-on-background shadow-neo-sm w-fit transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
			<h1 class="font-headline text-4xl font-extrabold text-primary tracking-tight" style="text-shadow: 2px 2px 0px #0f172a;">MAGANG-BN</h1>
		</div>
		
		<div class="bg-surface p-8 border-4 border-on-background shadow-neo w-full text-left">
			{@render children()}
		</div>
	</main>
</div>

<style>
	/* Custom animation for entrance */
	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	:global(.animate-fade-in-up) { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>
