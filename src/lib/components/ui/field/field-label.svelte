<script lang="ts">
	import { Label } from "$lib/components/ui/label/index.js";
	import { cn } from "$lib/utils.js";
	import type { ComponentProps } from "svelte";

	let { ref = $bindable(null), class: className, children, ...restProps }: ComponentProps<typeof Label> = $props();
</script>

<Label
	bind:ref
	data-slot="field-label"
	class={cn(
		"text-muted-foreground mb-1.5 block text-xs font-medium",
		"group-data-[disabled=true]/field:opacity-50",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Label>
