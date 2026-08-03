<script lang="ts">
  let {
    checked = false,
    disabled = false,
    onchange,
    class: customClass = '',
  } = $props<{
    checked?: boolean;
    disabled?: boolean;
    onchange?: (e: Event) => void;
    class?: string;
  }>();
</script>

<label class="relative inline-flex items-center justify-center w-5 h-5 neo-border-xs bg-surface cursor-pointer {disabled ? 'opacity-40 pointer-events-none' : ''} hover:bg-surface-container-high transition-colors {customClass}">
  <input
    type="checkbox"
    {checked}
    {disabled}
    {onchange}
    class="appearance-none w-full h-full cursor-pointer"
  />
  {#if checked}
    <span class="absolute text-on-surface text-xs font-bold pointer-events-none">✓</span>
  {/if}
</label>
