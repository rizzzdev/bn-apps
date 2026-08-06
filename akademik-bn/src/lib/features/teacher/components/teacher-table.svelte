<script lang="ts">
	import { ActionButtons } from '$lib/components/molecules';
	import {
		DataTable,
		TableHead,
		TableHeadCell,
		TableBody,
		TableRow,
		TableCell
	} from '$lib/components/organisms/table';
	import type { Teacher } from '$lib/types';

	let { teachers = [] as Teacher[], onView } = $props<{
		teachers: Teacher[];
		onView?: (teacher: Teacher) => void;
	}>();
</script>

<DataTable>
	<table class="w-full text-left border-collapse">
		<TableHead>
			<TableRow>
				<TableHeadCell width="w-16" align="center">No</TableHeadCell>
				<TableHeadCell>Nama Guru</TableHeadCell>
				<TableHeadCell>NIP</TableHeadCell>
				<TableHeadCell>Kelas yang Diampu</TableHeadCell>
				<TableHeadCell>Tahun Ajaran</TableHeadCell>
				<TableHeadCell align="center" width="w-48">Aksi</TableHeadCell>
			</TableRow>
		</TableHead>
		<TableBody>
			{#each teachers as teacher, i}
				<TableRow striped={i % 2 !== 0}>
					<TableCell align="center" class="font-data-mono text-data-mono font-bold">
						{String(i + 1).padStart(2, '0')}
					</TableCell>
					<TableCell class="font-body-md text-body-md font-bold">{teacher.fullname}</TableCell>
					<TableCell class="font-data-mono text-data-mono">{teacher.nip}</TableCell>
					<TableCell align="center">
						<span
							class="bg-secondary-container text-on-secondary-container px-2 py-1 border-2 border-on-background font-bold inline-block font-data-mono text-data-mono"
						>
							{teacher.class}
						</span>
					</TableCell>
					<TableCell class="font-data-mono text-data-mono">{teacher.academicYear}</TableCell>
					<TableCell align="center">
						<div class="flex justify-center">
							<ActionButtons onView={onView ? () => onView(teacher) : undefined} />
						</div>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</table>
</DataTable>
