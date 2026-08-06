<script lang="ts">
	import { TooltipIconButton } from '$lib/components/molecules';
	import { Badge } from '$lib/components/atoms';
	import {
		DataTable,
		TableHead,
		TableHeadCell,
		TableBody,
		TableRow,
		TableCell
	} from '$lib/components/organisms/table';
	import type { Subject } from '$lib/types';

	let {
		subjects = [] as Subject[],
		onView,
		onAddTeacher,
		onHistoryTeacher
	} = $props<{
		subjects: Subject[];
		onView?: (subject: Subject) => void;
		onAddTeacher?: (subject: Subject) => void;
		onHistoryTeacher?: (subject: Subject) => void;
	}>();
</script>

<DataTable>
	<table class="w-full text-left border-collapse">
		<TableHead>
			<TableRow>
				<TableHeadCell width="w-[6%]" align="center">No</TableHeadCell>
				<TableHeadCell width="w-[34%]">Mata Pelajaran</TableHeadCell>
				<TableHeadCell width="w-[15%]" align="center">Jumlah Guru</TableHeadCell>
				<TableHeadCell width="w-[45%]" align="center">Aksi</TableHeadCell>
			</TableRow>
		</TableHead>
		<TableBody>
			{#each subjects as subject, i}
				<TableRow striped={i % 2 !== 0}>
					<TableCell align="center" class="font-data-mono text-sm font-bold">
						{String(i + 1).padStart(2, '0')}
					</TableCell>
					<TableCell>
						<div class="flex flex-col gap-1">
							<span class="text-sm font-medium">{subject.name}</span>
							<Badge variant="default" class="w-fit">{subject.code}</Badge>
						</div>
					</TableCell>
					<TableCell align="center" class="font-data-mono text-sm"
						>{subject.totalTeachers}</TableCell
					>
					<TableCell align="center">
						<div class="flex justify-center items-center gap-2">
							{#if onView}
								<TooltipIconButton
									icon="visibility"
									tooltip="Lihat Detail"
									onclick={() => onView(subject)}
								/>
							{/if}
							{#if onAddTeacher}
								<TooltipIconButton
									icon="person_add"
									tooltip="Tambah Pemetaan Guru"
									onclick={() => onAddTeacher(subject)}
								/>
							{/if}
							{#if onHistoryTeacher}
								<TooltipIconButton
									icon="history"
									tooltip="Riwayat Guru Mata Pelajaran"
									onclick={() => onHistoryTeacher(subject)}
								/>
							{/if}
						</div>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</table>
</DataTable>
