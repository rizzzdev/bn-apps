<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	let {
		unread = 0,
		ariaLabel = 'Chat',
		onclick
	}: {
		unread?: number;
		ariaLabel?: string;
		onclick: () => void;
	} = $props();
</script>

<div class="relative">
	<Button variant="secondary" size="icon" class="rounded-full!" {onclick}>
		{#snippet children()}
			<svg
				class="w-5 h-5"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				viewBox="0 0 24 24"
				aria-label={ariaLabel}
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
				/>
			</svg>
		{/snippet}
	</Button>
	{#if unread > 0}
		<span
			class="absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded-full text-[10px] font-black leading-none"
			style="background-color:#ef4444; color:#fff; border:2px solid var(--nb-border); box-shadow:2px 2px 0 0 var(--nb-border); min-width:1.25rem; text-align:center;"
		>
			{unread > 99 ? '99+' : unread}
		</span>
	{/if}
</div>
