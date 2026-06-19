<script lang="ts">
	import { cn } from "$lib/utils";
	import type { Snippet } from "svelte";

	type Variant = "default" | "secondary" | "outline" | "destructive";

	let {
		class: className = "",
		variant = "default",
		children
	}: {
		class?: string;
		variant?: Variant;
		children?: Snippet;
	} = $props();

	const variants: Record<Variant, string> = {
		default: "bg-primary/10 text-primary border-primary/20",
		secondary: "bg-secondary text-secondary-foreground border-border",
		outline: "bg-transparent border-border text-muted-foreground",
		destructive: "bg-destructive/10 text-destructive border-destructive/20"
	};
</script>

<span
	class={cn(
		"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
		variants[variant],
		className
	)}
>
	{@render children?.()}
</span>
