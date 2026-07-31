<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { authState, getHomePath } from '$lib/features/auth/auth.svelte';

onMount(async () => {
	if (!authState.user) {
		await authState.checkSession();
	}

	if (authState.user) {
		goto(getHomePath(authState.user.role));
	} else {
		goto('/login');
	}
});
</script>

<div class="min-h-screen flex items-center justify-center font-bold text-xl">Loading...</div>
