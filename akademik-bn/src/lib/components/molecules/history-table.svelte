<script lang="ts">
	import { Badge } from '$lib/components/atoms';
	import {
		DataTable,
		TableHead,
		TableHeadCell,
		TableBody,
		TableRow,
		TableCell
	} from '$lib/components/organisms/table';

	export interface HistoryItem {
		id: string;
		academicYearCode?: string;
		teacherName: string;
		teacherNip?: string;
		status: string;
		createdAt?: string;
	}

	let {
		items = [] as HistoryItem[],
		isLoading = false,
		error = '',
		emptyMessage = 'Belum ada riwayat pimpinan'
	}: {
		items: HistoryItem[];
		isLoading?: boolean;
		error?: string;
		emptyMessage?: string;
	} = $props();
</script>

<DataTable {isLoading} {error} isEmpty={items.length === 0} {emptyMessage}>
	<table class="w-full text-left border-collapse">
		<TableHead>
			<TableRow>
				<TableHeadCell width="w-[8%]" align="center">No</TableHeadCell>
				<TableHeadCell width="w-[22%]">Tahun Ajaran</TableHeadCell>
				<TableHeadCell width="w-[45%]">Nama Guru</TableHeadCell>
				<TableHeadCell width="w-[25%]" align="center">Status</TableHeadCell>
			</TableRow>
		</TableHead>
		<TableBody>
			{#each items as item, i}
				<TableRow striped={i % 2 !== 0}>
					<TableCell align="center" class="font-data-mono text-sm font-bold">
						{String(i + 1).padStart(2, '0')}
					</TableCell>
					<TableCell class="font-data-mono text-sm">
						{item.academicYearCode || '-'}
					</TableCell>
					<TableCell>
						<div class="flex flex-col">
							<span class="text-sm font-bold">{item.teacherName}</span>
							{#if item.teacherNip}
								<span class="font-data-mono text-xs text-on-surface-variant">
									NIP: {item.teacherNip}
								</span>
							{/if}
						</div>
					</TableCell>
					<TableCell align="center">
						<Badge variant={item.status === 'Aktif' ? 'success' : 'default'}>
							{item.status}
						</Badge>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</table>
</DataTable>
