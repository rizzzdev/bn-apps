<script lang="ts">
	let {
		label,
		text,
		selected = false,
		onclick
	}: {
		label: string;
		text: string;
		selected?: boolean;
		onclick?: () => void;
	} = $props();
</script>

<button
	class="w-full flex items-center gap-3 p-4 text-left transition-all duration-100 {selected
		? 'exam-option-selected'
		: 'exam-option'}"
	{onclick}
>
	<span
		class="shrink-0 w-7 h-7 flex items-center justify-center text-xs font-black {selected
			? 'exam-option-label-selected'
			: 'exam-option-label'}"
	>
		{label}
	</span>
	<span class="text-sm text-(--text-primary) {selected ? 'font-bold' : 'font-medium'}">
		{text}
	</span>
</button>
