<script lang="ts">
	let { class: className = '', ...rest } = $props<{
		class?: string;
		[key: string]: unknown;
	}>();
</script>

<div class="flex items-center gap-2">
	<a
		href="/"
		class="bg-primary text-on-primary px-2 py-1 neo-border neo-shadow-sm font-headline-md text-lg font-black uppercase tracking-tighter no-underline"
	>
		Akademik-BN
	</a>
</div>
