<script lang="ts">
	import { Toast } from '$lib/components/molecules';
	import { toast } from '$lib/stores/toast.svelte';
</script>

<div class="fixed bottom-0 right-0 z-[200] p-md flex flex-col gap-sm pointer-events-none w-full md:w-auto">
	<div class="flex flex-col gap-sm items-end pointer-events-auto">
		{#each toast.toasts as t (t.id)}
			<Toast data={t} />
		{/each}
	</div>
</div>
