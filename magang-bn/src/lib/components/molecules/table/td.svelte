<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	type TdVariant =
		| "default"
		| "mono"
		| "bold"
		| "compact"
		| "muted"
		| "action";
	type Align = "left" | "center" | "right";

	interface Props extends HTMLAttributes<HTMLTableCellElement> {
		bordered?: boolean;
		align?: Align;
		variant?: TdVariant;
		truncate?: boolean;
		colspan?: number;
		colSpan?: number;
		rowspan?: number;
		rowSpan?: number;
		children?: Snippet;
	}

	let {
		bordered = true,
		align = "left",
		variant = "default",
		truncate = false,
		colspan,
		colSpan,
		rowspan,
		rowSpan,
		children,
		...rest
	}: Props = $props();

	let finalColSpan = $derived(colSpan ?? colspan);
	let finalRowSpan = $derived(rowSpan ?? rowspan);

	let alignClass = $derived(
		align === "center"
			? "text-center"
			: align === "right"
				? "text-right"
				: "text-left",
	);

	let variantClasses = $derived.by(() => {
		switch (variant) {
			case "bold":
				return "font-mono font-bold text-xs p-2.5";
			case "mono":
				return "font-mono text-xs p-2.5";
			case "muted":
				return "font-mono text-xs text-secondary p-2.5";
			case "compact":
				return "font-mono text-[10px] p-1";
			case "action":
				return "p-2 text-center";
			default:
				return "font-mono text-xs p-2.5";
		}
	});
</script>

<td
	colSpan={finalColSpan}
	rowSpan={finalRowSpan}
	class="{variantClasses} {bordered
		? 'border-r-2 border-on-background'
		: ''} {alignClass} {truncate ? 'truncate max-w-[150px]' : ''}"
	{...rest}
>
	{#if children}{@render children()}{/if}
</td>
