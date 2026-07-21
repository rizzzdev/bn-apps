<script lang="ts">
	type ReplyPreview = { id: string; senderName: string; message: string } | null;

	let {
		text = $bindable(''),
		replyingTo = null,
		disabled = false,
		placeholder = 'Ketik pesan...',
		onSend,
		onCancelReply
	}: {
		text?: string;
		replyingTo?: ReplyPreview;
		disabled?: boolean;
		placeholder?: string;
		onSend: () => void;
		onCancelReply: () => void;
	} = $props();

	function truncate(s: string, n = 55): string {
		return s.length > n ? s.slice(0, n) + '…' : s;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSend();
		}
	}
</script>

{#if replyingTo}
	<div
		class="flex items-center gap-2 px-3 py-2 shrink-0"
		style="border-top:2px solid var(--nb-border); background-color:var(--bg-secondary);"
	>
		<div class="flex-1 min-w-0 pl-2" style="border-left:4px solid var(--color-primary-500);">
			<p
				class="text-xs font-black uppercase tracking-wide truncate"
				style="color:var(--color-primary-500);"
			>
				{replyingTo.senderName}
			</p>
			<p class="text-xs truncate" style="color:var(--text-secondary);">
				{truncate(replyingTo.message)}
			</p>
		</div>
		<button
			class="shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-black text-base leading-none transition-all duration-100 hover:translate-x-px hover:translate-y-px"
			style="border:2px solid var(--nb-border); background-color:var(--nb-card-bg); box-shadow:2px 2px 0 0 var(--nb-shadow); color:var(--text-secondary);"
			onclick={onCancelReply}
			aria-label="Batal balas">×</button
		>
	</div>
{/if}

<div
	class="flex gap-2 p-3 shrink-0"
	style="border-top:2px solid var(--nb-border); background-color:var(--nb-card-bg);"
>
	<textarea
		class="flex-1 resize-none text-sm rounded-md"
		rows="2"
		{placeholder}
		bind:value={text}
		onkeydown={onKeydown}
		{disabled}
		style="padding:6px 10px; background-color:var(--bg-secondary); color:var(--text-primary); border:2px solid var(--nb-border); box-shadow:3px 3px 0 0 var(--nb-shadow); outline:none;"
	></textarea>
	<button
		class="shrink-0 p-2 rounded-md self-end transition-all duration-100 hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
		onclick={onSend}
		disabled={!text.trim() || disabled}
		aria-label="Kirim"
		style="background-color:var(--color-primary-500); color:white; border:2px solid var(--nb-border); box-shadow:3px 3px 0 0 var(--nb-shadow);"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
			/>
		</svg>
	</button>
</div>
