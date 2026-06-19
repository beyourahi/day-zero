<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	type Variant = "default" | "outline" | "ghost" | "destructive" | "secondary";
	type Size = "sm" | "default" | "lg" | "icon" | "icon-sm";

	let {
		class: className = "",
		variant = "default",
		size = "default",
		children,
		...props
	}: {
		class?: string;
		variant?: Variant;
		size?: Size;
		children?: Snippet;
	} & HTMLButtonAttributes = $props();

	const variants: Record<Variant, string> = {
		default: "bg-primary text-primary-foreground pointer-fine:hover:bg-primary/80",
		outline:
			"bg-background pointer-fine:hover:bg-muted pointer-fine:hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
		ghost: "pointer-fine:hover:bg-muted pointer-fine:hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
		secondary: "bg-secondary text-secondary-foreground pointer-fine:hover:bg-secondary/80",
		destructive:
			"bg-destructive/10 text-destructive pointer-fine:hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20"
	};

	const sizes: Record<Size, string> = {
		sm: "h-7 gap-1 rounded-md px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
		default: "h-9 gap-1.5 rounded-lg px-3.5 text-sm",
		lg: "h-10 gap-2 rounded-lg px-5 text-sm",
		icon: "size-9 rounded-lg",
		"icon-sm": "size-7 rounded-md"
	};
</script>

<button
	data-slot="button"
	class={cn(
		"group/button inline-flex shrink-0 items-center justify-center bg-clip-padding font-medium whitespace-nowrap",
		"transition-all outline-none select-none",
		"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2",
		"disabled:pointer-events-none disabled:opacity-50",
		"active:translate-y-px active:scale-[0.98]",
		"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		variants[variant],
		sizes[size],
		className
	)}
	{...props}
>
	{@render children?.()}
</button>
