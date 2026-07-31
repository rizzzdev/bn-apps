<script lang="ts">
	import LoginForm from '$lib/features/auth/LoginForm.svelte';
	import LoginDecorativeOrnaments from '$lib/features/auth/LoginDecorativeOrnaments.svelte';
</script>

<div class="bg-background bg-grid-boxes text-on-background min-h-screen flex flex-col justify-center items-center font-body-md text-body-md relative p-4 md:p-12">
	<LoginDecorativeOrnaments />
	<LoginForm />
</div>
