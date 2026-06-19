<!-- Small icon + DS Eyebrow (mono, uppercase, wide-tracked) above a form section heading. -->
<script lang="ts">
	import type { Component, ComponentProps } from "svelte";
	import type { Icon as LucideIcon } from "@lucide/svelte";
	import { Eyebrow } from "$lib/ds";

	let { icon: Icon, label }: { icon: Component<ComponentProps<typeof LucideIcon>>; label: string } = $props();
</script>

<div class="flex items-center gap-2">
	<Icon size={13} class="text-ink-muted" aria-hidden="true" />
	<Eyebrow>{label}</Eyebrow>
</div>
