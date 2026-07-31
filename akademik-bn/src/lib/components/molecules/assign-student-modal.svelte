<script lang="ts">
	import { Button } from '$lib/components/atoms';
	import { Modal, SearchableSelect } from '$lib/components/molecules';
	import type { ShadowStudent } from '$lib/types';

	let {
		isOpen = $bindable(false),
		title = 'Tambah Pemetaan Murid',
		targetLabel = 'Tujuan',
		selectedTargetId = $bindable(''),
		targetOptions = [] as { value: string; label: string }[],
		selectedStudentIds = $bindable([] as string[]),
		students = [] as ShadowStudent[],
		showTargetSelect = true,
		onSave
	}: {
		isOpen: boolean;
		title?: string;
		targetLabel?: string;
		selectedTargetId?: string;
		targetOptions?: { value: string; label: string }[];
		selectedStudentIds: string[];
		students: ShadowStudent[];
		showTargetSelect?: boolean;
		onSave: () => void;
	} = $props();

	const studentOptions = $derived(
		students.map((s) => ({
			value: s.id,
			label: `${s.fullname}${s.nisn ? ` (NISN: ${s.nisn})` : ''}`
		}))
	);
</script>

<Modal bind:isOpen {title}>
	<div class="flex flex-col gap-4">
		{#if showTargetSelect}
			<SearchableSelect
				id="assign-target-select"
				label={targetLabel}
				bind:value={selectedTargetId}
				options={targetOptions}
				placeholder={`Pilih ${targetLabel}`}
			/>
		{/if}

		<SearchableSelect
			id="assign-student-select"
			label="Murid"
			bind:value={selectedStudentIds}
			options={studentOptions}
			placeholder="Pilih Murid"
			multiple={true}
		/>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={onSave}>Simpan</Button>
	{/snippet}
</Modal>
