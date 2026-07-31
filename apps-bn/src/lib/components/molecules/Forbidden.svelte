<script lang="ts">
  import Button from '$lib/components/atoms/Button.svelte';
  import { resolveRoute } from '$app/paths';
</script>

<div class="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8 md:py-16 flex items-center justify-center relative z-10 box-border">
  <div class="max-w-xl w-full">
    <!-- Error Card -->
    <div class="bg-surface-container neo-border neo-shadow p-6 sm:p-10 rounded-2xl text-center flex flex-col items-center">
      
      <!-- Status Badge -->
      <div class="mb-4">
        <span class="inline-block bg-error text-white font-label-bold text-xs md:text-sm px-4 py-1.5 neo-border rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
          HTTP 403 • FORBIDDEN
        </span>
      </div>

      <!-- Big Status Code Number -->
      <h1 class="text-7xl sm:text-8xl md:text-9xl font-headline-lg font-black tracking-tight text-on-surface mb-4 leading-none">
        403
      </h1>

      <!-- Title -->
      <h2 class="font-headline-lg text-xl sm:text-2xl md:text-3xl text-on-surface mb-3 uppercase font-bold tracking-tight">
        Akses Ditolak
      </h2>

      <!-- Description -->
      <p class="font-body-md text-on-surface-variant text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        Maaf, Anda tidak memiliki hak akses untuk membuka halaman ini. Silakan hubungi Administrator jika Anda memerlukan akses tambahan.
      </p>

      <!-- Action Button -->
      <a href={resolveRoute('/')} class="w-full sm:w-auto">
        <Button variant="primary" className="!w-auto px-8 py-3">
          Kembali ke Beranda
        </Button>
      </a>

    </div>
  </div>
</div>
