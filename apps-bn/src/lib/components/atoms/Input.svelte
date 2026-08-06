<script lang="ts">
	let {
		value = $bindable(''),
		placeholder = '',
		type = 'text',
		name = '',
		label = '',
		icon = '',
		dotColor = 'bg-secondary-fixed',
		className = '',
		id = name,
		allowTogglePassword = false,
		oninput,
		onchange,
		onkeyup
	}: {
		value?: string;
		placeholder?: string;
		type?: string;
		name?: string;
		label?: string;
		icon?: string;
		dotColor?: string;
		className?: string;
		id?: string;
		allowTogglePassword?: boolean;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
		onkeyup?: (e: KeyboardEvent) => void;
	} = $props();

	let showPassword = $state(false);

	let inputType = $derived(type === 'password' ? (showPassword ? 'text' : 'password') : type);
</script>

<div class="flex flex-col gap-1.5 {className}">
	{#if label}
		<label
			class="flex items-center gap-2 font-headline-md text-sm font-bold text-on-surface uppercase"
			for={id}
		>
			<span class="h-2.5 w-2.5 {dotColor} inline-block rounded-sm border-2 border-black"></span>
			{label}
		</label>
	{/if}
	<div class="neo-border neo-focus relative rounded-lg bg-surface-container-lowest transition-all">
		{#if icon}
			<span
				class="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-on-surface-variant"
				>{icon}</span
			>
		{/if}
		<input
			{id}
			{name}
			type={inputType}
			{placeholder}
			bind:value
			{oninput}
			{onchange}
			{onkeyup}
			class="w-full {icon ? 'pl-10' : 'px-3'} {type === 'password' || allowTogglePassword
				? 'pr-10'
				: 'pr-3'} rounded-lg border-none bg-transparent py-2.5 font-label-bold text-sm text-on-surface outline-none placeholder:text-outline focus:ring-0"
		/>
		{#if type === 'password' || allowTogglePassword}
			<button
				type="button"
				onclick={() => (showPassword = !showPassword)}
				class="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center text-on-surface-variant transition-colors hover:text-primary"
				aria-label={showPassword ? 'Hide password' : 'Show password'}
			>
				<span class="material-symbols-outlined text-[18px]">
					{showPassword ? 'visibility_off' : 'visibility'}
				</span>
			</button>
		{/if}
	</div>
</div>
