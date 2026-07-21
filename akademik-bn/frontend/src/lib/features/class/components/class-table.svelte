<script lang="ts">
  import { TooltipIconButton } from '$lib/components/molecules';
  import { Badge } from '$lib/components/atoms';
  import { DataTable, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from '$lib/components/organisms/table';
  import type { Class } from '$lib/types';

  let {
    classes = [] as Class[],
    onView,
    onAddStudent,
    onSetHomeroom,
    onHistoryHomeroom,
    onHistoryAlumni
  } = $props<{
    classes: Class[];
    onView?: (cls: Class) => void;
    onAddStudent?: (cls: Class) => void;
    onSetHomeroom?: (cls: Class) => void;
    onHistoryHomeroom?: (cls: Class) => void;
    onHistoryAlumni?: (cls: Class) => void;
  }>();
</script>

<DataTable>
  {#snippet children()}
    <table class="w-full text-left border-collapse">
      <TableHead>
        <TableRow>
          <TableHeadCell width="w-[6%]" align="center">No</TableHeadCell>
          <TableHeadCell width="w-[39%]">Nama Kelas</TableHeadCell>
          <TableHeadCell width="w-[20%]" align="center">Jumlah Murid</TableHeadCell>
          <TableHeadCell width="w-[35%]" align="center">Aksi</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {#each classes as cls, i}
          <TableRow striped={i % 2 !== 0}>
            <TableCell align="center" class="font-data-mono text-data-mono font-bold">
              {String(i + 1).padStart(2, '0')}
            </TableCell>
            <TableCell>
              <div class="flex flex-col gap-1">
                <span class="font-body-md text-body-md font-bold">{cls.name}</span>
                <Badge variant="default" class="w-fit">{cls.majorCode}</Badge>
              </div>
            </TableCell>
            <TableCell align="center" class="font-data-mono text-data-mono"
              >{cls.totalStudents}</TableCell
            >
            <TableCell align="center">
              <div class="flex justify-center items-center gap-2">
                {#if onView}
                  <TooltipIconButton
                    icon="visibility"
                    tooltip="Lihat Detail"
                    onclick={() => onView(cls)}
                  />
                {/if}
                {#if onAddStudent}
                  <TooltipIconButton
                    icon="person_add"
                    tooltip="Tambah Pemetaan Murid"
                    onclick={() => onAddStudent(cls)}
                  />
                {/if}

                {#if onSetHomeroom}
                  <TooltipIconButton
                    icon="admin_panel_settings"
                    tooltip="Set Wali Kelas"
                    onclick={() => onSetHomeroom(cls)}
                  />
                {/if}
                {#if onHistoryHomeroom}
                  <TooltipIconButton
                    icon="history"
                    tooltip="Riwayat Wali Kelas"
                    onclick={() => onHistoryHomeroom(cls)}
                  />
                {/if}
                {#if onHistoryAlumni}
                  <TooltipIconButton
                    icon="school"
                    tooltip="Riwayat Alumni & Murid"
                    onclick={() => onHistoryAlumni(cls)}
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
