<script lang="ts">
	import RichTextEditor from './RichTextEditor.svelte';
	import Button from './Button.svelte';
	import Badge from './Badge.svelte';

	interface Question {
		question: string;
		options: string[];
		correctOption: number;
	}

	let {
		questions = $bindable([] as Question[]),
	}: {
		questions?: Question[];
	} = $props();

	let currentQuestion = $state('');
	let currentOptions = $state<string[]>(['', '']);
	let currentCorrect = $state(0);

	function addOption() {
		currentOptions = [...currentOptions, ''];
	}

	function removeOption(index: number) {
		if (currentOptions.length <= 2) return;
		currentOptions = currentOptions.filter((_, i) => i !== index);
		if (currentCorrect >= currentOptions.length) {
			currentCorrect = currentOptions.length - 1;
		}
	}

	function addQuestion() {
		if (!currentQuestion.trim()) return;
		const validOptions = currentOptions.filter((o) => o.trim());
		if (validOptions.length < 2) return;

		questions = [
			...questions,
			{
				question: currentQuestion,
				options: validOptions,
				correctOption: currentCorrect,
			},
		];
		currentQuestion = '';
		currentOptions = ['', ''];
		currentCorrect = 0;
	}

	function removeQuestion(index: number) {
		questions = questions.filter((_, i) => i !== index);
	}
</script>

<div class="space-y-6">
	{#each questions as q, i}
		<div class="neo-border bg-surface p-4 rounded-lg">
			<div class="flex items-start justify-between mb-2">
				<span class="font-label-bold text-sm">Soal {i + 1}</span>
				<button onclick={() => removeQuestion(i)} class="text-error text-sm">
					<span class="material-symbols-outlined">delete</span>
				</button>
			</div>
			<div class="mb-2 text-sm">{@html q.question}</div>
			<ul class="space-y-1">
				{#each q.options as opt, oi}
					<li class="flex items-center gap-2 text-sm">
						<span class="font-label-bold">{String.fromCharCode(65 + oi)}.</span>
						<span>{opt}</span>
						{#if oi === q.correctOption}
							<Badge variant="success">Benar</Badge>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/each}

	<div class="neo-border bg-surface p-4 rounded-lg">
		<h3 class="font-label-bold mb-3">Tambah Soal Baru</h3>

		<div class="mb-3">
			<span class="block text-sm font-label-bold mb-1">Soal</span>
			<RichTextEditor bind:value={currentQuestion} placeholder="Tulis soal..." />
		</div>

		<div class="space-y-2 mb-3">
			<span class="block text-sm font-label-bold">Pilihan Jawaban</span>
			{#each currentOptions as opt, i}
				<div class="flex items-center gap-2">
					<input
						type="radio"
						name="correctOption"
						bind:group={currentCorrect}
						value={i}
						class="accent-primary"
					/>
					<span class="text-sm font-label-bold w-6">{String.fromCharCode(65 + i)}.</span>
					<input
						type="text"
						bind:value={currentOptions[i]}
						placeholder="Pilihan {String.fromCharCode(65 + i)}"
						class="input-neo flex-1 px-2 py-1 text-sm"
					/>
					<button onclick={() => removeOption(i)} class="text-error text-sm" disabled={currentOptions.length <= 2}>
						<span class="material-symbols-outlined text-sm">close</span>
					</button>
				</div>
			{/each}
			<button onclick={addOption} class="text-sm text-primary font-label-bold flex items-center gap-1 mt-1">
				<span class="material-symbols-outlined text-sm">add</span>
				Tambah Pilihan
			</button>
		</div>

		<Button onclick={addQuestion} variant="primary" size="sm">Tambah Soal</Button>
	</div>
</div>
