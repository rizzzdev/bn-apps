<script lang="ts">
  import { apiClient, getCookie } from "$lib/utils/api";
  import { onMount } from "svelte";

  let students = $state<any[]>([]);
  let loading = $state(true);
  let error = $state("");

  onMount(async () => {
    try {
      const response = await apiClient("/api/v1/students");
      students = response.data;
    } catch (err) {
      console.error("Fetch error:", err);
      error = "Terjadi kesalahan jaringan: " + (err as Error).message;
    } finally {
      loading = false;
    }
  });
</script>

<h1>Welcome to Magang-BN</h1>
<p>Daftar Murid:</p>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p class="text-error">{error}</p>
{:else}
  <pre>{JSON.stringify(students, null, 2)}</pre>
{/if}
