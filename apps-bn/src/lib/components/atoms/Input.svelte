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

	let inputType = $derived(
		type === 'password' ? (showPassword ? 'text' : 'password') : type
	);
</script>

<div class="flex flex-col gap-1.5 {className}">
	{#if label}
		<label class="font-headline-md text-sm text-on-surface uppercase flex items-center gap-2 font-bold" for={id}>
			<span class="w-2.5 h-2.5 {dotColor} border-2 border-black rounded-sm inline-block"></span>
			{label}
		</label>
	{/if}
	<div class="relative rounded-lg neo-border bg-surface-container-lowest transition-all neo-focus">
		{#if icon}
			<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">{icon}</span>
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
			class="w-full {icon ? 'pl-10' : 'px-3'} {type === 'password' || allowTogglePassword ? 'pr-10' : 'pr-3'} py-2.5 bg-transparent border-none focus:ring-0 font-label-bold text-sm text-on-surface placeholder:text-outline rounded-lg outline-none"
		/>
		{#if type === 'password' || allowTogglePassword}
			<button
				type="button"
				onclick={() => (showPassword = !showPassword)}
				class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
				aria-label={showPassword ? 'Hide password' : 'Show password'}
			>
				<span class="material-symbols-outlined text-[18px]">
					{showPassword ? 'visibility_off' : 'visibility'}
				</span>
			</button>
		{/if}
	</div>
</div>
