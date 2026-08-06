<script lang="ts">
	import Title from '$lib/components/atoms/Title.svelte';
</script>

<footer
	class="relative z-40 mt-4 box-border w-full border-t-2 border-black bg-primary md:mt-6 md:border-t-3 dark:bg-primary-container"
>
	<div
		class="mx-auto box-border flex w-full flex-col items-center justify-between px-4 py-3 sm:px-6 md:flex-row md:py-4.5 lg:px-8"
	>
		<Title size="sm" variant="white" className="mb-2 md:mb-0" />

		<div
			class="text-center font-label-bold text-[10px] text-on-primary opacity-50 md:text-right md:text-xs dark:text-on-primary-container"
		>
			© 2026 APPS-BN SCHOOL SYSTEM. ALL RIGHTS RESERVED.
		</div>
	</div>
</footer>
