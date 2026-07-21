<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/features/auth/auth.svelte';

	onMount(() => {
		if (authState.user) {
			if (authState.user.role === 'teacher') goto('/teacher');
			else goto('/student');
		} else {
			goto('/login');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center font-bold text-xl">Loading...</div>
