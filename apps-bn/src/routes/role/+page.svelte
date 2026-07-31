<script lang="ts">
  import Navbar from '$lib/components/organisms/Navbar.svelte';
  import Footer from '$lib/components/organisms/Footer.svelte';
  import UserTable from '$lib/features/role/UserTable.svelte';
  import Banner from '$lib/components/molecules/Banner.svelte';
  import Forbidden from '$lib/components/molecules/Forbidden.svelte';

  let { data } = $props();

  let isSuperAdmin = $derived(
    data.isSuperAdmin !== undefined 
      ? data.isSuperAdmin 
      : Boolean(
          data.user?.roles &&
          (Array.isArray(data.user.roles) 
            ? data.user.roles.includes('super_admin') 
            : data.user.roles === 'super_admin')
        )
  );
</script>

<div class="bg-background bg-grid-boxes text-on-background min-h-screen flex flex-col font-body-md text-body-md relative overflow-x-hidden w-full box-border pt-14 md:pt-16">
  <Navbar currentPath="/role" />
  
  {#if isSuperAdmin}
    <main class="flex-grow w-full px-4 sm:px-6 lg:px-8 py-3 md:py-5 relative z-10 box-border">
      <div class="w-full space-y-4 md:space-y-6">
        <!-- Header Banner Section -->
        <Banner
          badgeText="MANAJEMEN HAK AKSES"
          title="Manajemen Akses Sistem"
          description="Kelola Pengguna dan Hak Akses (Role) di dalam satu halaman terpusat."
          icon="admin_panel_settings"
          variant="secondary"
        />

        <!-- User Table -->
        <UserTable users={data.users} roles={data.roles} pagination={data.pagination} />
      </div>
    </main>
  {:else}
    <Forbidden />
  {/if}

  <Footer />
</div>
