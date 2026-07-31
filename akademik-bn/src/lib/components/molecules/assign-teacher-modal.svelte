<script lang="ts">
	import { Button } from '$lib/components/atoms';
	import { Modal, SearchableSelect } from '$lib/components/molecules';
	import { formatTeacherName } from '$lib/utils/image';
	import type { ShadowTeacher } from '$lib/types';

	let {
		isOpen = $bindable(false),
		title = 'Set Pimpinan Guru',
		label = 'Pilih Guru',
		selectedTeacherId = $bindable(''),
		teachers = [] as ShadowTeacher[],
		onSave
	}: {
		isOpen: boolean;
		title?: string;
		label?: string;
		selectedTeacherId: string;
		teachers: ShadowTeacher[];
		onSave: () => void;
	} = $props();

	const teacherOptions = $derived(
		teachers.map((t) => ({
			value: t.id,
			label: `${formatTeacherName(t)}${t.nip ? ` (${t.nip})` : ''}`
		}))
	);
</script>

<Modal bind:isOpen {title}>
	<div class="flex flex-col gap-4">
		<SearchableSelect
			id="assign-teacher-select"
			{label}
			bind:value={selectedTeacherId}
			options={teacherOptions}
			placeholder="Pilih Guru"
		/>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={onSave}>Simpan</Button>
	{/snippet}
</Modal>
