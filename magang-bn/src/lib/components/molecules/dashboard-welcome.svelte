<script lang="ts">
	let { title, description } = $props<{ title: string; description: string }>();
</script>

<div class="bg-surface border-2 border-on-background shadow-neo-sm p-3.5 mt-2 animate-fade-in-up">
	<h2 class="font-headline text-sm md:text-base font-black mb-0.5 uppercase">{title}</h2>
	<p class="font-mono text-[10px] text-secondary font-bold">{description}</p>
</div>

<style>
	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>
