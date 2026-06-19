<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLInputAttributes } from "svelte/elements";

	let {
		class: className = "",
		value = $bindable(""),
		...props
	}: {
		class?: string;
		value?: string | number;
	} & HTMLInputAttributes = $props();
</script>

<input
	data-slot="input"
	class={cn(
		"bg-input/30 text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-sm shadow-xs",
		"transition-[color,box-shadow] outline-none",
		"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
		"aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
		"disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	bind:value
	{...props}
/>
