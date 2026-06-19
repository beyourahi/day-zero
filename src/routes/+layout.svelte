<!--
	Root layout. Owns the global app shell, cross-route View Transitions, and the
	AI Copilot mount. Copilot is gated to the home route only: `data.aiEnabled`
	(feature flag) AND route id `/` AND no active error. Desktop (lg+) renders a
	fixed right-rail <aside> with AiSidebar; mobile gets AiMobileFab +
	AiMobileSheet; AiConfirmDialog mounts globally for Tier-B confirmations.
	When the rail shows, the main column reserves space via lg:pr-[calc(...)] using
	the --copilot-rail-width tokens. The footer renders globally below the routed
	content; the "by dropout studio" credit lives there.
-->
<script lang="ts">
	import "../app.css";
	import type { Snippet } from "svelte";
	import { page } from "$app/state";
	import { onNavigate } from "$app/navigation";
	import { handleViewTransition } from "$lib/motion";
	import { Footer } from "$lib/components/ui/footer";
	import AiSidebar from "$src/components/ai/AiSidebar.svelte";
	import AiConfirmDialog from "$src/components/ai/AiConfirmDialog.svelte";
	import AiMobileFab from "$src/components/ai/AiMobileFab.svelte";
	import AiMobileSheet from "$src/components/ai/AiMobileSheet.svelte";
	import type { LayoutData } from "./$types";

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	// Wires cross-route View Transitions; no-ops when unavailable or motion is reduced.
	onNavigate(handleViewTransition);

	const showCopilot = $derived(data.aiEnabled && page.route.id === "/" && !page.error);
</script>

<svelte:head>
	<title>Day Zero</title>
	<meta
		name="description"
		content="Track every goal as a live countdown — many milestones, one clean board, no ads."
	/>
</svelte:head>

<div
	class={[
		"flex min-h-dvh flex-col",
		showCopilot &&
			"lg:pr-[calc(var(--copilot-rail-width)+1.5rem)] xl:pr-[calc(var(--copilot-rail-width-xl)+1.5rem)]"
	]}
>
	<div class="flex grow flex-col">
		{@render children()}
	</div>
	<Footer />
</div>

{#if showCopilot}
	<aside
		class="fixed top-0 right-0 z-40 hidden h-dvh p-2.5 lg:block lg:w-[var(--copilot-rail-width)] xl:w-[var(--copilot-rail-width-xl)]"
	>
		<AiSidebar />
	</aside>

	<AiMobileFab />
	<AiMobileSheet />
	<AiConfirmDialog />
{/if}
