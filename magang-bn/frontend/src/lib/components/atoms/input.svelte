<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from './icon.svelte';

	interface Props extends HTMLInputAttributes {
		value?: string;
		icon?: string;
		error?: string;
	}

	let {
		value = $bindable(''),
		icon,
		error,
		class: className = '',
		type = 'text',
		...rest
	}: Props = $props();
	
	let baseClasses =
		'w-full bg-surface border-4 text-on-background font-body py-3 px-3 transition-all duration-200 outline-none focus:ring-0';
	
	let stateClasses = $derived(
		error 
			? 'border-error focus:border-error bg-red-50' 
			: 'border-on-background focus:border-primary'
	);
	
	let showPassword = $state(false);
	let actualType = $derived(type === 'password' ? (showPassword ? 'text' : 'password') : type);
</script>

<div class="relative w-full group">
	{#if icon}
		<span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
			<Icon name={icon} class="text-slate-500 {error ? 'text-error' : ''}" />
		</span>
	{/if}
	<input
		bind:value
		type={actualType}
		class="{baseClasses} {stateClasses} {icon ? 'pl-10' : ''} {type === 'password' ? 'pr-12' : ''} {className}"
		{...rest}
	/>
	{#if type === 'password'}
		<button 
			type="button"
			class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-primary transition-colors cursor-pointer"
			onclick={() => showPassword = !showPassword}
			aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
			tabindex="-1"
		>
			<Icon name={showPassword ? 'visibility_off' : 'visibility'} />
		</button>
	{/if}
</div>
