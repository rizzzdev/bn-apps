<script lang="ts">
	import Table from './table/table.svelte';
	import type { Snippet } from 'svelte';

	let props: {
		loading?: boolean;
		empty?: boolean;
		emptyMessage?: string;
		colSpan?: number;
		minWidth?: string;
		class?: string;
		children?: Snippet;
		header?: Snippet;
		loadingSnippet?: Snippet;
		emptySnippet?: Snippet;
	} = $props();
</script>

<Table {...props} />
