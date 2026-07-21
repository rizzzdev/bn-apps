<script lang="ts">
	import { AuthLayout } from '$lib/components/templates';
	import { LoginForm } from '$lib/features/auth';
</script>

<svelte:head>
	<title>Masuk - Master Data BN</title>
</svelte:head>

<AuthLayout>
	<LoginForm />
</AuthLayout>
