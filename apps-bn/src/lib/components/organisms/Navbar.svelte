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

<header
	class="fixed top-0 right-0 left-0 z-50 box-border w-full border-b-2 border-black bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:border-b-3 md:shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)] dark:bg-surface-container"
>
	<div
		class="mx-auto box-border flex w-full items-center justify-between px-4 py-2 sm:px-6 md:py-2.5 lg:px-8"
	>
		<Title size="md" />

		<button
			type="button"
			onclick={handleSignOut}
			class="group relative cursor-pointer overflow-hidden rounded-lg border-2 border-black bg-error px-3 py-1 font-label-bold text-xs tracking-wider text-white uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:border-3 md:px-4 md:py-1.5 md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
		>
			<span class="relative z-10">Sign Out</span>
			<div
				class="absolute inset-0 z-0 h-full w-0 bg-[#93000a] transition-all duration-500 ease-out group-hover:w-full"
			></div>
		</button>
	</div>
</header>
