<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { SelectOption } from '$lib/components/ui/CustomSelect.svelte';
	import type { Subject } from '$lib/types';

	let {
		subjects = [],
		classes = [],
		subjectId = '',
		classId = '',
		pathname = '.'
	}: {
		subjects?: Subject[];

		classes?: { id: string; name: string }[];
		subjectId?: string;
		classId?: string;
		pathname?: string;
	} = $props();

	let selectedSubjectId = $state('');
	let selectedClassId = $state('');
	$effect(() => {
		selectedSubjectId = subjectId;
		selectedClassId = classId;
	});

	const subjectOptions = $derived<SelectOption[]>([
		{ value: '', label: 'Semua Mapel' },
		...subjects.map((subject) => ({
			value: subject.id,
			label: subject.code ? `${subject.code} — ${subject.name}` : subject.name
		}))
	]);
	const classOptions = $derived<SelectOption[]>([
		{ value: '', label: 'Semua Kelas' },
		...classes.map((item) => ({ value: item.id, label: item.name }))
	]);
</script>

<form method="GET" action={pathname} class="card flex flex-col gap-3 p-4">
	<div class="w-full">
		<Select
			id="report-subject"
			name="subjectId"
			label="Mapel"
			options={subjectOptions}
			bind:value={selectedSubjectId}
			searchable
		/>
	</div>
	<div class="w-full">
		<Select
			id="report-class"
			name="classId"
			label="Kelas"
			options={classOptions}
			bind:value={selectedClassId}
			searchable
		/>
	</div>
	<div class="flex w-full flex-row gap-2">
		<Button type="submit" size="sm" class="min-h-10 flex-1">Terapkan</Button>
		<Button
			type="button"
			variant="secondary"
			size="sm"
			onclick={() => (window.location.href = pathname)}
			class="min-h-10 flex-1"
		>
			Reset
		</Button>
	</div>
</form>
