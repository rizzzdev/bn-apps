<script lang="ts">
  import { Button, Input, Icon } from "$lib/components/atoms";
  import { FormField } from "$lib/components/molecules";

  import { PUBLIC_MASTER_API_URL } from "$env/static/public";
  import { toast } from "$lib/stores/toast.svelte";
  import { goto } from "$app/navigation";

  let email = $state("");
  let password = $state("");
  let isLoading = $state(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    isLoading = true;

    try {
      const res = await fetch(`${PUBLIC_MASTER_API_URL}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: email,
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && !data.error) {
        const token = data.data?.accessToken || data.accessToken;
        if (token) {
          document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
          toast.success("Login berhasil! Selamat datang.");
          goto("/");
        } else {
          toast.error("Token tidak ditemukan di respons server");
        }
      } else {
        toast.error("Email atau password salah");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat terhubung ke server");
    } finally {
      isLoading = false;
    }
  };
</script>

<div>
  <div class="mb-6 pb-4 border-b-4 border-on-background">
    <h2 class="font-headline text-2xl font-bold text-on-background">Masuk</h2>
  </div>

  <form onsubmit={handleSubmit} class="space-y-6">
    <FormField id="email" label="EMAIL">
      <Input
        id="email"
        type="text"
        icon="person"
        placeholder="user@email.com"
        bind:value={email}
        required
      />
    </FormField>

    <FormField id="password" label="PASSWORD">
      <Input
        id="password"
        type="password"
        icon="lock"
        placeholder="••••••••"
        bind:value={password}
        required
      />
    </FormField>

    <div class="pt-4">
      <Button type="submit" class="w-full text-lg group" {isLoading}>
        MASUK
        {#if !isLoading}
          <Icon
            name="arrow_forward"
            filled
            class="transition-transform group-hover:translate-x-1"
          />
        {/if}
      </Button>
    </div>
  </form>
</div>
