<script lang="ts">
  import { Icon, Checkbox } from '$lib/components/atoms';
  import { DataTable } from '$lib/components/organisms/table';
  import type { LessonHour } from '$lib/types';
  import { WORK_DAYS } from '$lib/constants';

  export interface TimetableCellSlot {
    id: string;
    subjectName: string;
    day: string;
    lessonHourId: string;
    teachers?: { id: string; name: string }[];
    classes?: { id: string; name: string }[];
    notes?: string | null;
    selected?: boolean;
    colorClass?: string;
  }

  let {
    hours = [],
    days = WORK_DAYS as unknown as string[],
    slots = [],
    selectedIds = [],
    selectable = false,
    onSlotClick = undefined,
    onToggleSelect = undefined
  } = $props<{
    hours: LessonHour[];
    days?: string[];
    slots: TimetableCellSlot[];
    selectedIds?: string[];
    selectable?: boolean;
    onSlotClick?: (slot: TimetableCellSlot) => void;
    onToggleSelect?: (slotId: string) => void;
  }>();

  let sortedHours = $derived([...hours].sort((a, b) => a.order - b.order));

  // Map day + hour -> slots
  let slotsMap = $derived.by(() => {
    const map = new Map<string, TimetableCellSlot[]>();
    for (const slot of slots) {
      const key = `${slot.day}_${slot.lessonHourId}`;
      const existing = map.get(key) || [];
      existing.push(slot);
      map.set(key, existing);
    }
    return map;
  });

  function isSelected(slotId: string): boolean {
    return selectedIds.includes(slotId);
  }

  function handleSlotClick(slot: TimetableCellSlot, e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    // Klik pada checkbox/label-nya sudah ditangani lewat onchange komponen Checkbox,
    // jadi jangan ikut memicu toggle dari sel (menghindari toggle ganda).
    if (target && target.closest('input[type="checkbox"], label')) {
      return;
    }
    if (onToggleSelect && selectable) {
      onToggleSelect(slot.id);
    }
    if (onSlotClick) {
      onSlotClick(slot);
    }
  }
</script>

<DataTable>
  {#snippet children()}
    <table class="w-full border-collapse font-data-mono text-data-mono">
      <thead>
        <tr class="neo-border-b bg-surface-container">
          <th class="p-3 text-left font-label-caps text-label-caps uppercase text-on-surface-variant border-r-2 border-on-surface min-w-[120px]">
            Jam
          </th>
          {#each days as day}
            <th class="p-3 text-left font-label-caps text-label-caps uppercase text-on-surface-variant border-r-2 border-on-surface last:border-r-0 min-w-[200px]">
              {day}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sortedHours as lh}
          <tr class="neo-border-b last:border-b-0">
            <td class="p-3 font-bold text-on-surface-variant border-r-2 border-on-surface align-top whitespace-nowrap text-xs leading-tight">
              {lh.name}<br />
              <span class="font-data-mono text-xs">{lh.startTime} - {lh.endTime}</span>
            </td>

            {#each days as day}
              {@const daySlots = slotsMap.get(`${day}_${lh.id}`) || []}
              <td class="p-2 border-r-2 last:border-r-0 align-top">
                {#if daySlots.length === 0}
                  <div class="min-h-[60px] flex items-center justify-center">
                    <span class="text-on-surface-variant opacity-30 text-xs">—</span>
                  </div>
                {:else}
                  {#each daySlots as slot}
                    {@const selected = isSelected(slot.id)}
                    <div
                      class="neo-border-sm p-2 mb-2 last:mb-0 transition-shadow hover:shadow-[2px_2px_0px_0px_#1C1B1B] {slot.colorClass
                        ? slot.colorClass
                        : selected
                        ? 'bg-primary-container border-primary'
                        : 'bg-surface'} {onSlotClick || selectable ? 'cursor-pointer' : ''}"
                      onclick={(e) => handleSlotClick(slot, e)}
                      onkeydown={(e) => e.key === 'Enter' && handleSlotClick(slot, e as any)}
                      role="button"
                      tabindex="0"
                    >
                      <div class="flex items-start gap-2">
                        {#if selectable}
                          <Checkbox
                            checked={selected}
                            onchange={() => {
                              if (onToggleSelect) onToggleSelect(slot.id);
                            }}
                            class="shrink-0 mt-0.5"
                          />
                        {/if}
                        <div class="min-w-0 flex-1">
                          <p class="font-bold text-sm leading-tight truncate">{slot.subjectName}</p>

                          <!-- Teachers (team teaching) -->
                          {#if slot.teachers && slot.teachers.length > 0}
                            <div class="mt-1 flex flex-wrap gap-1">
                              {#each slot.teachers as t}
                                <span class="bg-secondary-fixed-dim text-xs px-1.5 py-0.5 neo-border-xs whitespace-nowrap flex items-center gap-1">
                                  <Icon name="person" size="10px" />
                                  {t.name}
                                </span>
                              {/each}
                            </div>
                          {/if}

                          <!-- Classes (batch teaching) -->
                          {#if slot.classes && slot.classes.length > 0}
                            <div class="mt-1 flex flex-wrap gap-1">
                              {#each slot.classes as c}
                                <span class="bg-tertiary-fixed-dim text-xs px-1.5 py-0.5 neo-border-xs whitespace-nowrap flex items-center gap-1">
                                  <Icon name="school" size="10px" />
                                  {c.name}
                                </span>
                              {/each}
                            </div>
                          {/if}

                          {#if slot.notes}
                            <p class="text-xs text-on-surface-variant mt-1 italic truncate">📝 {slot.notes}</p>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {/snippet}
</DataTable>
