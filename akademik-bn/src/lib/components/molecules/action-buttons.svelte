<script lang="ts">
	import { Icon } from '$lib/components/atoms';

	let {
		onView,
		onEdit,
		onDelete,
		viewTitle = 'Lihat Detail',
		editTitle = 'Edit',
		deleteTitle = 'Hapus',
		class: className = ''
	} = $props<{
		onView?: () => void;
		onEdit?: () => void;
		onDelete?: () => void;
		viewTitle?: string;
		editTitle?: string;
		deleteTitle?: string;
		class?: string;
	}>();
</script>

<div class="flex items-center gap-4 {className}">
	{#if onView}
		<button
			onclick={onView}
			class="flex items-center justify-center p-1.5 border-2 border-on-background bg-primary-fixed text-on-primary-fixed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
			title={viewTitle}
		>
			<Icon name="visibility" size="18px" class="group-hover:scale-110 transition-transform" />
		</button>
	{/if}

	{#if onEdit}
		<button
			onclick={onEdit}
			class="flex items-center justify-center p-1.5 border-2 border-on-background bg-secondary-fixed text-on-secondary-fixed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
			title={editTitle}
		>
			<Icon name="edit" size="18px" class="group-hover:scale-110 transition-transform" />
		</button>
	{/if}

	{#if onDelete}
		<button
			onclick={onDelete}
			class="flex items-center justify-center p-1.5 border-2 border-on-background bg-error text-on-error shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
			title={deleteTitle}
		>
			<Icon name="delete" size="18px" class="group-hover:scale-110 transition-transform" />
		</button>
	{/if}
</div>
