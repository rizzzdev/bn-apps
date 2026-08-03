<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	let { content = '' }: { content?: string } = $props();

	// Configure marked options for GitHub Flavored Markdown (GFM)
	marked.setOptions({
		gfm: true,
		breaks: true,
	});

	let html = $derived(
		DOMPurify.sanitize(marked.parse(content, { async: false }) as string, {
			ADD_ATTR: ['target', 'type', 'checked'],
		})
	);
</script>

<div class="markdown-body">{@html html}</div>

<style lang="postcss">
	@reference "../../routes/layout.css";

	.markdown-body {
		@apply text-on-surface leading-relaxed overflow-hidden;
	}
	.markdown-body :global(h1) {
		@apply text-2xl font-bold mb-4 mt-6 text-on-surface border-b-2 border-on-surface/20 pb-2;
	}
	.markdown-body :global(h2) {
		@apply text-xl font-bold mb-3 mt-5 text-on-surface border-b border-on-surface/10 pb-1;
	}
	.markdown-body :global(h3) {
		@apply text-lg font-bold mb-2 mt-4 text-on-surface;
	}
	.markdown-body :global(p) {
		@apply mb-3;
	}
	.markdown-body :global(ul) {
		@apply list-disc pl-6 mb-3;
	}
	.markdown-body :global(ol) {
		@apply list-decimal pl-6 mb-3;
	}
	.markdown-body :global(li) {
		@apply mb-1;
	}
	.markdown-body :global(ul[data-type='taskList']),
	.markdown-body :global(ul.contains-task-list) {
		@apply list-none pl-0 mb-3;
	}
	.markdown-body :global(ul[data-type='taskList'] li),
	.markdown-body :global(li.task-list-item) {
		@apply flex items-center gap-2 mb-1 pl-0;
	}
	.markdown-body :global(input[type='checkbox']) {
		@apply w-4 h-4 accent-primary cursor-pointer border-2 border-on-surface;
	}
	.markdown-body :global(strong) {
		@apply font-bold;
	}
	.markdown-body :global(em) {
		@apply italic;
	}
	.markdown-body :global(u),
	.markdown-body :global(ins) {
		@apply underline text-on-surface;
	}
	.markdown-body :global(s),
	.markdown-body :global(del) {
		@apply line-through text-secondary;
	}
	.markdown-body :global(blockquote) {
		@apply border-l-4 border-primary pl-4 italic my-4 text-secondary bg-surface-container/60 py-2 font-body-md border-3 border-on-surface border-r-0 border-t-0 border-b-0;
	}
	.markdown-body :global(code) {
		@apply bg-surface-container px-2 py-0.5 border-2 border-on-surface text-xs font-mono text-on-surface;
	}
	.markdown-body :global(pre) {
		@apply bg-surface-container p-4 border-2 border-on-surface overflow-x-auto my-4 text-sm font-mono text-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)];
	}
	.markdown-body :global(pre code) {
		@apply bg-transparent p-0 border-none text-sm;
	}
	.markdown-body :global(a) {
		@apply text-primary font-label-bold underline hover:text-primary-container transition-colors;
	}
	.markdown-body :global(table) {
		@apply w-full border-collapse my-4 border-2 border-on-surface bg-surface-container-lowest overflow-x-auto block sm:table;
	}
	.markdown-body :global(th) {
		@apply border-2 border-on-surface bg-surface-container p-2.5 text-left font-label-bold text-sm text-on-surface;
	}
	.markdown-body :global(td) {
		@apply border-2 border-on-surface p-2.5 text-sm text-on-surface;
	}
	.markdown-body :global(tr:nth-child(even)) {
		@apply bg-surface-container-lowest;
	}
	.markdown-body :global(img) {
		@apply max-w-full h-auto border-2 border-on-surface my-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)];
	}
	.markdown-body :global(hr) {
		@apply border-t-2 border-on-surface my-6;
	}
</style>
