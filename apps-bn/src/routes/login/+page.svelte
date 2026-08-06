<script lang="ts">
	import LoginForm from '$lib/features/auth/LoginForm.svelte';
	import LoginDecorativeOrnaments from '$lib/features/auth/LoginDecorativeOrnaments.svelte';
</script>

<div
	class="bg-grid-boxes text-body-md relative flex min-h-dvh flex-col items-center justify-center bg-background p-4 font-body-md text-on-background md:p-12"
>
	<LoginDecorativeOrnaments />
	<LoginForm />
</div>
