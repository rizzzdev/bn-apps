<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		children,
		variant = "primary",
		class: className = "",
	} = $props<{
		children: Snippet;
		variant?: "primary" | "secondary" | "error" | "surface" | "warning";
		class?: string;
	}>();

	let variantClass = $derived(
		variant === "primary"
			? "bg-primary text-white"
			: variant === "secondary"
				? "bg-secondary text-white"
				: variant === "error"
					? "bg-error text-white"
					: variant === "warning"
						? "bg-[#FCD34D] text-white"
						: "bg-surface text-on-background",
	);
</script>

<span
	class="inline-flex items-center justify-center px-1 py-0.5 border-2 border-on-background text-[10px] font-mono font-bold uppercase tracking-wider {variantClass} {className}"
>
	{@render children()}
</span>
