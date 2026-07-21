<script lang="ts">
	import Icon from './icon.svelte';

	let {
		value = $bindable(),
		placeholder = '',
		type = 'text',
		class: className = '',
		...rest
	} = $props<{
		value?: string;
		placeholder?: string;
		type?: 'text' | 'password' | 'email' | 'number' | string;
		class?: string;
		[key: string]: unknown;
	}>();

	let isPasswordVisible = $state(false);

	let currentType = $derived(type === 'password' && isPasswordVisible ? 'text' : type);
</script>

<div class="relative flex items-center w-full">
	<input
		type={currentType}
		{placeholder}
		bind:value
		class="w-full font-body-base text-body-base text-on-surface placeholder:text-on-surface-variant outline-none bg-transparent {type === 'password' ? 'pr-10' : ''} {className}"
		{...rest}
	/>
	{#if type === 'password'}
		<button
			type="button"
			class="absolute right-2 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none"
			onclick={() => (isPasswordVisible = !isPasswordVisible)}
			aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
			title={isPasswordVisible ? 'Hide password' : 'Show password'}
		>
			<Icon name={isPasswordVisible ? 'visibility_off' : 'visibility'} class="text-xl" />
		</button>
	{/if}
</div>
