<script lang="ts">
	import { AuthLayout } from '$lib/components/templates';
	import { LoginForm } from '$lib/features/auth';
</script>

<svelte:head>
	<title>Login - Magang-BN</title>
</svelte:head>

<AuthLayout>
	<LoginForm />
</AuthLayout>
