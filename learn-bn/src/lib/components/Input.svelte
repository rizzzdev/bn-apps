<script lang="ts">
	let {
		value = $bindable(''),
		label = '',
		type = 'text',
		placeholder = '',
		required = false,
		error = '',
		icon = '',
		class: className = ''
	} = $props<{
		value?: string;
		label?: string;
		type?: string;
		placeholder?: string;
		required?: boolean;
		error?: string;
		icon?: string;
		class?: string;
	}>();

	let showPassword = $state(false);
	let actualType = $derived(type === 'password' && showPassword ? 'text' : type);

	function togglePassword() {
		showPassword = !showPassword;
	}
</script>

<div class="flex flex-col gap-2 relative {className}">
	{#if label}
		<label class="font-label-bold text-label-bold text-on-surface uppercase tracking-widest flex flex-col gap-2">
			<span>
				{label}
				{#if required}
					<span class="text-error">*</span>
				{/if}
			</span>
			<div class="relative">
				{#if icon}
					<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">{icon}</span>
				{/if}
				<input
					type={actualType}
					bind:value
					{placeholder}
					{required}
					class="w-full bg-surface-container-lowest neo-border py-3 font-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:ring-0 focus:border-on-surface input-neo transition-shadow duration-100 ease-in-out {icon ? 'pl-10' : 'px-4'} {type === 'password' ? 'pr-12' : 'pr-4'} {error ? 'border-error shadow-[4px_4px_0px_0px_#ba1a1a]' : ''}"
				/>
				{#if type === 'password'}
					<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors" onclick={togglePassword} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
						<span class="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
					</button>
				{/if}
			</div>
		</label>
	{:else}
		<div class="relative">
			{#if icon}
				<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">{icon}</span>
			{/if}
			<input
				type={actualType}
				bind:value
				{placeholder}
				{required}
				class="w-full bg-surface-container-lowest neo-border py-3 font-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:ring-0 focus:border-on-surface input-neo transition-shadow duration-100 ease-in-out {icon ? 'pl-10' : 'px-4'} {type === 'password' ? 'pr-12' : 'pr-4'} {error ? 'border-error shadow-[4px_4px_0px_0px_#ba1a1a]' : ''}"
			/>
			{#if type === 'password'}
				<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors" onclick={togglePassword} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
					<span class="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
				</button>
			{/if}
		</div>
	{/if}
	{#if error}
		<span class="text-error text-xs font-label-bold">{error}</span>
	{/if}
</div>
