<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import Title from '$lib/components/Title.svelte';

	let { title = 'EduBrutal' } = $props<{ title?: string }>();
	let user = $derived(authState.user);
</script>

<header
	class="bg-surface flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-20 sticky top-0 z-30 border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]"
>
	<div class="flex items-center gap-4">
		<button class="md:hidden p-2 text-on-surface neo-border shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] bg-white active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
			<span class="material-symbols-outlined">menu</span>
		</button>
		<div class="md:hidden">
			<Title />
		</div>
	</div>
	<div class="flex items-center gap-4">
		<div
			class="hidden md:flex items-center bg-white neo-border px-3 py-2 w-64 focus-within:shadow-[4px_4px_0px_0px_#adff2f] transition-shadow"
		>
			<span class="material-symbols-outlined text-secondary mr-2">search</span>
			<input
				class="bg-transparent border-none outline-none w-full font-body-md text-sm placeholder:text-[#777777]"
				placeholder="Search..."
				type="text"
			/>
		</div>
		<div
			class="w-10 h-10 neo-border neo-shadow bg-surface-container overflow-hidden flex-shrink-0 cursor-pointer neo-shadow-hover transition-all flex items-center justify-center font-bold text-lg"
			title={user?.name || 'Guest'}
		>
			{#if user}
				{user.name.charAt(0).toUpperCase()}
			{:else}
				<span class="material-symbols-outlined">person</span>
			{/if}
		</div>
		<button
			class="bg-error-container text-on-error-container neo-border neo-shadow neo-shadow-hover neo-shadow-active font-label-bold text-label-bold py-2 px-4 hidden md:block transition-all uppercase"
			onclick={() => authState.logout()}
		>
			Keluar
		</button>
	</div>
</header>
