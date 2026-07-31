<script lang="ts">
	import Card from './Card.svelte';

	let {
		fullname,
		nis,
		pictureUrl,
	}: {
		fullname: string;
		nis?: string | null;
		pictureUrl?: string | null;
	} = $props();

	let initials = $derived(
		fullname
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	);
</script>

<Card>
	<div class="flex items-center gap-3">
		{#if pictureUrl}
			<img src={pictureUrl} alt={fullname} class="w-12 h-12 rounded-full object-cover border-2 border-on-surface" />
		{:else}
			<div
				class="w-12 h-12 rounded-full border-2 border-on-surface bg-primary-container flex items-center justify-center font-label-bold text-sm"
			>
				{initials}
			</div>
		{/if}
		<div>
			<p class="font-label-bold text-sm">{fullname}</p>
			{#if nis}
				<p class="text-xs text-secondary">NIS: {nis}</p>
			{/if}
		</div>
	</div>
</Card>
