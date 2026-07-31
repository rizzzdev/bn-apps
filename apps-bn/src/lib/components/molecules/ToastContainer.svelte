<script lang="ts">
  import { toast, type ToastItem } from '$lib/stores/toast';

  let items = $state<ToastItem[]>([]);

  toast.subscribe(value => {
    items = value;
  });

  const getVariantStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#22c55e] text-black',
          icon: 'check_circle',
          bar: 'bg-black'
        };
      case 'error':
        return {
          bg: 'bg-[#ff5449] text-white',
          icon: 'error',
          bar: 'bg-white'
        };
      case 'warning':
        return {
          bg: 'bg-[#f59e0b] text-black',
          icon: 'warning',
          bar: 'bg-black'
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#38bdf8] text-black',
          icon: 'info',
          bar: 'bg-black'
        };
    }
  };
</script>

<div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
  {#each items as item (item.id)}
    {@const style = getVariantStyles(item.type)}
    <div
      class="pointer-events-auto border-3 border-black rounded-xl p-4 neo-shadow relative overflow-hidden flex items-start gap-3 transition-all duration-300 transform translate-y-0 opacity-100 {style.bg}"
      role="alert"
    >
      <span class="material-symbols-outlined text-2xl shrink-0 mt-0.5 select-none">{style.icon}</span>
      
      <div class="flex-1 pr-6">
        {#if item.title}
          <h4 class="font-label-bold text-sm uppercase tracking-wide mb-0.5">{item.title}</h4>
        {/if}
        <p class="font-body-md text-xs md:text-sm leading-snug break-words">{item.message}</p>
      </div>

      <button
        type="button"
        onclick={() => toast.remove(item.id)}
        class="absolute top-2.5 right-2.5 p-1 rounded-md hover:bg-black/10 active:bg-black/20 transition-colors flex items-center justify-center border border-transparent hover:border-black/30 cursor-pointer"
        aria-label="Tutup"
      >
        <span class="material-symbols-outlined text-base">close</span>
      </button>

      {#if (item.duration || 0) > 0}
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/15 overflow-hidden">
          <div
            class="h-full {style.bar} opacity-60 animate-toast-progress"
            style="animation-duration: {item.duration}ms;"
          ></div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  @keyframes toast-progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .animate-toast-progress {
    animation-name: toast-progress;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }
</style>
