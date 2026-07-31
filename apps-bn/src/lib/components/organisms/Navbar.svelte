<script lang="ts">
	import Title from '$lib/components/atoms/Title.svelte';
	import { apiClient, deleteCookie } from '$lib/utils/api';

	let { currentPath: _currentPath = '/' }: { currentPath?: string } = $props();

	const handleSignOut = async (e: Event) => {
		e.preventDefault();
		try {
			await apiClient('/auth/logout', { method: 'POST' });
		} catch {
			// Ignore network errors during logout
		} finally {
			deleteCookie('access_token');
			deleteCookie('refresh_token');
			window.location.href = '/login';
		}
	};
</script>

<header class="fixed top-0 left-0 right-0 bg-surface dark:bg-surface-container w-full border-b-2 md:border-b-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)] z-50 box-border">
	<div class="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 py-2 md:py-2.5 mx-auto box-border">
		<Title size="md" />
		
		<button
			type="button"
			onclick={handleSignOut}
			class="bg-error text-white border-2 md:border-3 border-black font-label-bold text-xs px-3 py-1 md:px-4 md:py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all rounded-lg uppercase tracking-wider relative overflow-hidden group cursor-pointer"
		>
			<span class="relative z-10">Sign Out</span>
			<div class="absolute inset-0 h-full w-0 bg-[#93000a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>
		</button>
	</div>
</header>
