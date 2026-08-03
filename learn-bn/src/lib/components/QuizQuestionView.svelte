<script lang="ts">
	import MarkdownRenderer from './MarkdownRenderer.svelte';

	interface Question {
		id?: string;
		question: string;
		options: string[];
	}

	let {
		questions = [] as Question[],
		answers = $bindable([] as number[]),
		showCorrect = false,
		correctAnswers = [] as number[],
	}: {
		questions?: Question[];
		answers?: number[];
		showCorrect?: boolean;
		correctAnswers?: number[];
	} = $props();

	function selectAnswer(qIndex: number, optIndex: number) {
		answers[qIndex] = optIndex;
		answers = [...answers];
	}
</script>

<div class="space-y-6">
	{#each questions as q, qi}
		<div class="neo-border bg-surface p-4 rounded-lg">
			<p class="font-label-bold text-sm mb-3">Soal {qi + 1}</p>
			<div class="mb-3">
				<MarkdownRenderer content={q.question} />
			</div>
			<div class="space-y-2">
				{#each q.options as opt, oi}
					{@const isSelected = answers[qi] === oi}
					{@const isCorrect = showCorrect && correctAnswers[qi] === oi}
					{@const isWrong = showCorrect && isSelected && correctAnswers[qi] !== oi}

					<button
						onclick={() => selectAnswer(qi, oi)}
						class="w-full text-left p-3 rounded-lg border-2 font-label-bold text-sm transition-all duration-75
							{isSelected
								? 'bg-primary-container border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
								: 'bg-surface border-on-surface hover:bg-surface-container hover:translate-x-0.5 hover:translate-y-0.5'}
							{isCorrect ? '!bg-green-100 !border-green-500' : ''}
							{isWrong ? '!bg-red-100 !border-red-500' : ''}"
					>
						<div class="flex items-center gap-2">
							<span class="w-6 h-6 rounded-full border-2 border-on-surface flex items-center justify-center text-xs
								{isSelected ? 'bg-on-surface text-surface' : ''}">
								{String.fromCharCode(65 + oi)}
							</span>
							<span>{opt}</span>
							{#if isCorrect}
								<span class="material-symbols-outlined text-green-600 text-sm ml-auto">check_circle</span>
							{/if}
							{#if isWrong}
								<span class="material-symbols-outlined text-red-600 text-sm ml-auto">cancel</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>
