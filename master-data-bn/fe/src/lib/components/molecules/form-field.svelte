<script lang="ts">
	import { Label, Input, Icon } from '$lib/components/atoms';
	
	type FileVariant = 'file' | 'image' | 'excel';

	let {
		id,
		label,
		value = $bindable(),
		type = 'text',
		placeholder = '',
		error = '',
		class: className = '',
		accept = '',
		file = $bindable<File | null>(null),
		preview = $bindable<string>(''),
		existingImageUrl = $bindable<string | null>(null),
		markedForDeletion = false,
		onDeleteImage,
		onRestoreImage,
		...rest
	} = $props<{
		id: string;
		label: string;
		value?: string;
		type?: 'text' | 'password' | 'email' | 'number' | 'file' | 'image' | 'excel' | string;
		placeholder?: string;
		error?: string;
		class?: string;
		accept?: string;
		file?: File | null;
		preview?: string;
		existingImageUrl?: string | null;
		markedForDeletion?: boolean;
		onDeleteImage?: () => void;
		onRestoreImage?: () => void;
		[key: string]: unknown;
	}>();

	let isFileType = $derived(['file', 'image', 'excel'].includes(type));

	const defaultAccept: Record<string, string> = {
		image: 'image/*',
		excel: '.xlsx,.xls',
		file: '',
	};

	let currentAccept = $derived(accept || (type === 'image' || type === 'excel' || type === 'file' ? defaultAccept[type] : '') || '');

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const f = target.files?.[0];
		if (f) {
			file = f;
			if (type === 'image') {
				preview = URL.createObjectURL(f);
				// If user selects new file, cancel any pending deletion
				if (markedForDeletion) {
					onRestoreImage?.();
				}
			}
		}
		(rest.onchange as ((e: Event) => void) | undefined)?.(e);
	}

	function handleDeleteClick(e: Event) {
		e.stopPropagation();
		e.preventDefault();
		if (markedForDeletion) {
			// Undo deletion
			if (preview) {
				URL.revokeObjectURL(preview);
				preview = '';
				file = null;
			}
			onRestoreImage?.();
		} else {
			// Mark for deletion
			if (preview) {
				URL.revokeObjectURL(preview);
				preview = '';
				file = null;
			}
			onDeleteImage?.();
		}
	}

	// Determine which image to show
	let displaySrc = $derived(
		preview || existingImageUrl || null
	);
</script>

<div class="flex flex-col mb-sm w-full {className}">
	<Label for={id}>{label}</Label>
	{#if isFileType}
		<label for={id} class="border-3 border-dashed border-on-background rounded-lg p-md flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-surface-variant transition-colors cursor-pointer relative overflow-hidden min-h-25">
			<input {id} type="file" accept={currentAccept} class="absolute inset-0 opacity-0 cursor-pointer" onchange={handleFileChange} />
			{#if type === 'image'}
				{#if displaySrc}
					<!-- Only photo with X button — no upload text -->
					<div class="relative inline-block">
						<img
							src={displaySrc}
							alt="Preview"
							class="h-32 w-32 object-cover rounded-2xl border-4 border-on-background shadow-neo-lg transition-all duration-200 {markedForDeletion ? 'opacity-30 grayscale' : ''}"
						/>
						<button
							type="button"
							class="absolute -top-3 -right-3 h-8 w-8 border-3 rounded-lg border-on-background bg-error-container text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-all cursor-pointer shadow-neo-sm"
							onclick={handleDeleteClick}
						>
							<Icon name={markedForDeletion ? 'undo' : 'close'} class="text-base" fill={0} />
						</button>
					</div>
				{:else}
					<!-- Empty upload area -->
					<Icon name="upload_file" class="text-3xl text-on-surface-variant mb-xs" fill={0} />
					<span class="font-label-sm text-label-sm text-on-surface-variant">Pilih file untuk diunggah</span>
				{/if}
			{:else if file}
				<Icon name="description" class="text-3xl text-primary mb-xs" fill={0} />
				<span class="font-body-bold text-body-bold text-primary">{file.name}</span>
				<span class="font-label-sm text-label-sm text-on-surface-variant mt-1">{(file.size / 1024).toFixed(1)} KB</span>
			{:else}
				<Icon name="upload_file" class="text-3xl text-on-surface-variant mb-xs" fill={0} />
				<span class="font-label-sm text-label-sm text-on-surface-variant">Pilih file untuk diunggah</span>
			{/if}
		</label>
	{:else}
		<div class="w-full relative border-3 border-on-background rounded-lg bg-surface px-sm py-2.5 transition-all">
			<Input {id} {type} {placeholder} bind:value class="w-full" {...rest} />
		</div>
	{/if}
	{#if error}
		<span class="text-error font-label-sm text-label-sm mt-xs">{error}</span>
	{/if}
</div>
