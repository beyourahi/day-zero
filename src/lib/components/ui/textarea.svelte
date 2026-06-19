<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		class: className = "",
		value = $bindable(""),
		...props
	}: {
		class?: string;
		value?: string;
	} & HTMLTextareaAttributes = $props();
</script>

<textarea
	data-slot="textarea"
	class={cn(
		"bg-input/30 text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground min-h-16 w-full rounded-md px-3 py-2 text-sm shadow-xs",
		"resize-none transition-[color,box-shadow] outline-none",
		"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
		"aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
		"disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	bind:value
	{...props}></textarea>
