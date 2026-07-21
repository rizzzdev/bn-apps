<script lang="ts">
	let { class: className = '', ...rest } = $props<{
		class?: string;
		[key: string]: unknown;
	}>();
</script>

<a
	href="/"
	class="font-headline-lg text-headline-lg font-black uppercase tracking-tighter {className}"
	{...rest}
>
	Akademik-BN
</a>
