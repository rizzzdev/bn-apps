<script lang="ts">
  import { page } from '$app/stores';
  import { resolveRoute } from '$app/paths';
  import Navbar from '$lib/components/organisms/Navbar.svelte';
  import Footer from '$lib/components/organisms/Footer.svelte';
  import Button from '$lib/components/atoms/Button.svelte';

  let status = $derived($page.status);
  let is403 = $derived(status === 403);
  let is404 = $derived(status === 404);
</script>

<div class="bg-background bg-grid-boxes text-on-background min-h-screen flex flex-col font-body-md text-body-md relative overflow-x-hidden w-full box-border">
  <Navbar currentPath={$page.url ? $page.url.pathname : '/'} />

  <main class="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8 md:py-16 flex items-center justify-center relative z-10 box-border">
    <div class="max-w-xl w-full">
      <!-- Error Card -->
      <div class="bg-surface-container neo-border neo-shadow p-6 sm:p-10 rounded-2xl text-center flex flex-col items-center">
        
        <!-- Status Badge (Above Number to prevent text collision) -->
        <div class="mb-4">
          {#if is403}
            <span class="inline-block bg-error text-white font-label-bold text-xs md:text-sm px-4 py-1.5 neo-border rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
              HTTP 403 • FORBIDDEN
            </span>
          {:else if is404}
            <span class="inline-block bg-secondary-fixed text-black font-label-bold text-xs md:text-sm px-4 py-1.5 neo-border rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
              HTTP 404 • NOT FOUND
            </span>
          {:else}
            <span class="inline-block bg-tertiary-fixed text-black font-label-bold text-xs md:text-sm px-4 py-1.5 neo-border rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
              HTTP {status} • ERROR
            </span>
          {/if}
        </div>

        <!-- Big Status Code Number -->
        <h1 class="text-7xl sm:text-8xl md:text-9xl font-headline-lg font-black tracking-tight text-on-surface mb-4 leading-none">
          {status}
        </h1>

        <!-- Title -->
        <h2 class="font-headline-lg text-xl sm:text-2xl md:text-3xl text-on-surface mb-3 uppercase font-bold tracking-tight">
          {#if is403}
            Akses Ditolak
          {:else if is404}
            Halaman Tidak Ditemukan
          {:else}
            Terjadi Kesalahan Sistem
          {/if}
        </h2>

        <!-- Description -->
        <p class="font-body-md text-on-surface-variant text-sm sm:text-base max-w-md mb-8 leading-relaxed">
          {#if is403}
            Maaf, Anda tidak memiliki hak akses untuk membuka halaman ini. Silakan hubungi Administrator jika Anda memerlukan akses tambahan.
          {:else if is404}
            Halaman yang Anda tuju tidak ada atau telah dipindahkan. Silakan periksa kembali URL yang Anda tuju.
          {:else}
            Sistem kami mengalami kendala teknis saat memproses permintaan Anda. Silakan coba lagi nanti.
          {/if}
        </p>

        <!-- Action Button -->
        <a href={resolveRoute('/')} class="w-full sm:w-auto">
          <Button variant="primary" className="!w-auto px-8 py-3">
            Kembali ke Beranda
          </Button>
        </a>

      </div>
    </div>
  </main>

  <Footer />
</div>
