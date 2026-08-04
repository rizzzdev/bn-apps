<script lang="ts">
	let { data }: { data: any } = $props();

	const optionLabels = ['A', 'B', 'C', 'D'];

	let mcCorrect = $derived(
		data.questions.filter(
			(q: any) => q.type === 'MULTIPLE_CHOICE' && q.participantOptionId === q.correctOptionId
		).length
	);
	let mcTotal = $derived(data.questions.filter((q: any) => q.type === 'MULTIPLE_CHOICE').length);
	let essayPointsTotal = $derived(
		data.questions
			.filter((q: any) => q.type === 'ESSAY')
			.reduce((sum: number, q: any) => sum + (q.points ?? 0), 0)
	);
	let essayTotal = $derived(data.questions.filter((q: any) => q.type === 'ESSAY').length);
	let mcScore = $derived(mcTotal > 0 ? Math.round((mcCorrect / mcTotal) * 100) : 0);
	let essayScore = $derived(
		essayTotal > 0 ? Math.round((essayPointsTotal / (essayTotal * 10)) * 100) : 0
	);
	let mcWeightedScore = $derived(
		data.mcWeight !== null && mcTotal > 0 ? Math.round(mcScore * data.mcWeight) : null
	);
	let essayWeightedScore = $derived(
		data.essayWeight !== null && essayTotal > 0 ? Math.round(essayScore * data.essayWeight) : null
	);
	let computedTotal = $derived(
		mcWeightedScore !== null || essayWeightedScore !== null
			? (mcWeightedScore ?? 0) + (essayWeightedScore ?? 0)
			: data.totalScore
	);
</script>

<svelte:head>
	<title>Jawaban {data.participantName} - {data.examName}</title>
</svelte:head>

<div class="mb-6 flex items-center gap-2 text-sm text-(--text-secondary)">
	<a
		href="/supervisor/results"
		class="hover:text-primary-500 transition-colors">Hasil Ujian</a
	>
	<span>/</span>
	<span class="text-(--text-primary)">{data.participantName}</span>
</div>

<div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
	<div>
		<h1 class="text-2xl font-black text-(--text-primary)">{data.participantName}</h1>
		<p class="text-sm text-(--text-secondary) mt-1">
			{data.examName} &middot; {data.roomName} &middot; {data.participantEmail}
		</p>
	</div>
	{#if computedTotal !== null}
		<div class="card px-5 py-3 text-center shrink-0">
			<p class="text-xs text-(--text-secondary)">Nilai Total</p>
			<p
				class="text-3xl font-black mt-0.5 {computedTotal >= data.passingGrade
					? 'text-green-600'
					: computedTotal >= 50
						? 'text-amber-600'
						: 'text-red-600'}"
			>
				{computedTotal}
			</p>
			<p
				class="text-xs mt-1 font-bold {computedTotal >= data.passingGrade
					? 'text-green-600'
					: 'text-red-600'}"
			>
				{computedTotal >= data.passingGrade ? 'Lulus' : 'Tidak Lulus'} (KKM: {data.passingGrade})
			</p>
		</div>
	{/if}
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
	{#if mcTotal > 0}
		<div class="card p-4 flex items-center gap-4">
			<div class="icon-circle-blue w-10 h-10 flex items-center justify-center shrink-0">
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<div>
				<p class="text-xs text-(--text-secondary)">Pilihan Ganda</p>
				<p class="text-lg font-black text-(--text-primary)">{mcCorrect}/{mcTotal} benar</p>
				<p class="text-sm font-bold text-primary-500">Nilai: {mcScore}</p>
				{#if data.mcWeight !== null}
					<p class="text-xs text-(--text-secondary)">
						Bobot: {Math.round((data.mcWeight ?? 0) * 100)}%
					</p>
				{/if}
				{#if mcWeightedScore !== null}
					<p class="text-sm font-bold text-blue-600">Kontribusi: {mcWeightedScore} poin</p>
				{/if}
			</div>
		</div>
	{/if}
	{#if essayTotal > 0}
		<div class="card p-4 flex items-center gap-4">
			<div class="icon-circle-amber w-10 h-10 flex items-center justify-center shrink-0">
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				</svg>
			</div>
			<div>
				<p class="text-xs text-(--text-secondary)">Esai</p>
				<p class="text-lg font-black text-(--text-primary)">
					{essayPointsTotal}/{essayTotal * 10} poin
				</p>
				<p class="text-sm font-bold text-amber-600">Nilai: {essayScore}</p>
				{#if data.essayWeight !== null}
					<p class="text-xs text-(--text-secondary)">
						Bobot: {Math.round((data.essayWeight ?? 0) * 100)}%
					</p>
				{/if}
				{#if essayWeightedScore !== null}
					<p class="text-sm font-bold text-blue-600">Kontribusi: {essayWeightedScore} poin</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if data.questions.length === 0}
	<div class="card p-10 text-center font-bold text-(--text-secondary)">
		Tidak ada data soal untuk peserta ini.
	</div>
{:else}
	<div class="space-y-4">
		{#each data.questions as q}
			<div class="card p-5">
				<div class="flex items-start gap-3 mb-4">
					<span
						class="question-num-badge shrink-0 w-8 h-8 flex items-center justify-center text-sm font-black"
					>
						{q.number}
					</span>
					<p class="text-(--text-primary) font-medium leading-relaxed pt-1">{q.text}</p>
				</div>

				{#if q.type === 'MULTIPLE_CHOICE'}
					<div class="ml-11 space-y-2">
						{#each q.options as opt, i}
							{@const isCorrect = opt.id === q.correctOptionId}
							{@const isChosen = opt.id === q.participantOptionId}
							<div
								class="flex items-center gap-3 p-2.5 text-sm {isCorrect && isChosen
									? 'answer-opt-correct-chosen'
									: isChosen && !isCorrect
										? 'answer-opt-wrong-chosen'
										: isCorrect
											? 'answer-opt-correct-unchosen'
											: 'answer-opt'}"
							>
								<span
									class="opt-label shrink-0 w-6 h-6 flex items-center justify-center text-xs font-black {isCorrect
										? 'opt-label-correct'
										: isChosen
											? 'opt-label-wrong'
											: ''}"
								>
									{optionLabels[i]}
								</span>
								<span
									class="flex-1 {isChosen && !isCorrect
										? 'text-red-600'
										: isCorrect
											? 'text-green-600 font-medium'
											: 'text-(--text-primary)'}"
								>
									{opt.text}
								</span>
								<div class="ml-auto shrink-0">
									{#if isChosen && isCorrect}
										<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clip-rule="evenodd"
											/>
										</svg>
									{:else if isChosen && !isCorrect}
										<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
												clip-rule="evenodd"
											/>
										</svg>
									{:else if isCorrect}
										<span class="text-xs font-bold text-green-600">Jawaban benar</span>
									{/if}
								</div>
							</div>
						{/each}
						{#if q.participantDeletedOption}
							<div class="answer-opt-wrong-chosen flex items-center gap-3 p-2.5 text-sm mt-1">
								<span
									class="opt-label opt-label-wrong shrink-0 w-6 h-6 flex items-center justify-center text-xs font-black"
									>–</span
								>
								<span class="flex-1 text-red-600 line-through"
									>{q.participantDeletedOption.text}</span
								>
								<span class="text-xs text-(--text-secondary) shrink-0">Pilihan dihapus</span>
								<svg class="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						{:else if !q.participantOptionId}
							<p class="text-xs text-(--text-secondary) italic ml-2 mt-1">Tidak dijawab</p>
						{/if}
					</div>
				{:else}
					<div class="ml-11">
						{#if q.participantText}
							<div class="essay-text-box p-3 text-sm whitespace-pre-wrap leading-relaxed">
								{q.participantText}
							</div>
						{:else}
							<p class="text-xs text-(--text-secondary) italic">Tidak dijawab</p>
						{/if}
						<p class="mt-2 text-xs text-(--text-secondary)">
							Poin: <span class="font-bold text-(--text-primary)"
								>{q.points !== null ? `${q.points}/10` : 'Belum dinilai'}</span
							>
						</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
