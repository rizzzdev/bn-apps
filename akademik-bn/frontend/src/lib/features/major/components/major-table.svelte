<script lang="ts">
  import { TooltipIconButton } from '$lib/components/molecules';
  import { Badge } from '$lib/components/atoms';
  import { DataTable, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from '$lib/components/organisms/table';
  import type { Major } from '$lib/types';

  let {
    majors = [] as Major[],
    onView,
    onAddStudent,
    onSetHead,
    onHistoryHead,
    onHistoryStudent
  } = $props<{
    majors: Major[];
    onView?: (major: Major) => void;
    onAddStudent?: (major: Major) => void;
    onSetHead?: (major: Major) => void;
    onHistoryHead?: (major: Major) => void;
    onHistoryStudent?: (major: Major) => void;
  }>();
</script>

<DataTable>
  {#snippet children()}
    <table class="w-full text-left border-collapse">
      <TableHead>
        <TableRow>
          <TableHeadCell width="w-[6%]" align="center">No</TableHeadCell>
          <TableHeadCell width="w-[39%]">Nama Jurusan</TableHeadCell>
          <TableHeadCell width="w-[20%]" align="center">Jumlah Murid</TableHeadCell>
          <TableHeadCell width="w-[35%]" align="center">Aksi</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {#each majors as major, i}
          <TableRow striped={i % 2 !== 0}>
            <TableCell align="center" class="font-data-mono text-data-mono font-bold">
              {String(i + 1).padStart(2, '0')}
            </TableCell>
            <TableCell>
              <div class="flex flex-col gap-1">
                <span class="font-body-md text-body-md font-bold">{major.name}</span>
                <Badge variant="default" class="w-fit">{major.code}</Badge>
              </div>
            </TableCell>
            <TableCell align="center" class="font-data-mono text-data-mono"
              >{major.totalStudents}</TableCell
            >
            <TableCell align="center">
              <div class="flex justify-center items-center gap-2">
                {#if onView}
                  <TooltipIconButton
                    icon="visibility"
                    tooltip="Lihat Detail"
                    onclick={() => onView(major)}
                  />
                {/if}
                {#if onAddStudent}
                  <TooltipIconButton
                    icon="person_add"
                    tooltip="Tambah Pemetaan Murid"
                    onclick={() => onAddStudent(major)}
                  />
                {/if}
                {#if onSetHead}
                  <TooltipIconButton
                    icon="admin_panel_settings"
                    tooltip="Set Kepala Jurusan"
                    onclick={() => onSetHead(major)}
                  />
                {/if}
                {#if onHistoryHead}
                  <TooltipIconButton
                    icon="history"
                    tooltip="Riwayat Kepala Jurusan"
                    onclick={() => onHistoryHead(major)}
                  />
                {/if}
                {#if onHistoryStudent}
                  <TooltipIconButton
                    icon="school"
                    tooltip="Riwayat Alumni & Murid"
                    onclick={() => onHistoryStudent(major)}
                  />
                {/if}
              </div>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </table>
  {/snippet}
</DataTable>
