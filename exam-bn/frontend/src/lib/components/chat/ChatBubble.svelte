<script lang="ts">
	type ReplySnippet = { id: string; senderName: string; message: string } | null;

	let {
		id,
		mine,
		senderName,
		message,
		timestamp,
		replyTo = null,
		onReply,
		onScrollToReply
	}: {
		id: string;
		mine: boolean;
		senderName: string;
		message: string;
		timestamp: Date | string;
		replyTo?: ReplySnippet;
		onReply: () => void;
		onScrollToReply: (id: string) => void;
	} = $props();

	function formatTime(ts: Date | string): string {
		return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}

	function truncate(s: string, n = 55): string {
		return s.length > n ? s.slice(0, n) + '…' : s;
	}
</script>

<div class="flex {mine ? 'justify-end' : 'justify-start'} group" data-msg-id={id}>
	<div class="max-w-[82%]">
		{#if !mine}
			<p
				class="text-xs font-black uppercase tracking-wide mb-1 px-0.5"
				style="color:var(--text-secondary);"
			>
				{senderName}
			</p>
		{/if}

		{#if replyTo}
			<button
				class="w-full text-left mb-1.5 px-2 py-1.5 rounded-md transition-all duration-100 hover:translate-x-px hover:translate-y-px"
				style="border-left:4px solid var(--color-primary-500); border-top:2px solid var(--nb-border); border-right:2px solid var(--nb-border); border-bottom:2px solid var(--nb-border); background-color:var(--bg-secondary); box-shadow:2px 2px 0 0 var(--nb-border);"
				onclick={() => onScrollToReply(replyTo!.id)}
			>
				<p
					class="text-xs font-black uppercase tracking-wide truncate"
					style="color:var(--color-primary-500);"
				>
					{replyTo.senderName}
				</p>
				<p class="text-xs truncate mt-0.5" style="color:var(--text-secondary);">
					{truncate(replyTo.message)}
				</p>
			</button>
		{/if}

		<div class="flex items-end gap-1.5 {mine ? 'flex-row-reverse' : ''}">
			<div class="px-3 py-2 {mine ? 'nb-bubble-mine' : 'nb-bubble-theirs'}">
				<p class="text-sm leading-relaxed wrap-break-word">{message}</p>
			</div>

			<button
				class="opacity-0 group-hover:opacity-100 shrink-0 nb-reply-btn transition-all duration-100"
				onclick={onReply}
				aria-label="Balas"
			>
				<svg
					class="w-3 h-3"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
					/>
				</svg>
			</button>
		</div>

		<p
			class="text-xs font-bold mt-1 px-0.5 {mine ? 'text-right' : 'text-left'}"
			style="color:var(--text-secondary);"
		>
			{formatTime(timestamp)}
		</p>
	</div>
</div>
