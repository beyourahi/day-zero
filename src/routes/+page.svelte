<!--
	Home — the board. The whole point of Day Zero: every goal as a live countdown,
	all visible at once. The soonest upcoming goal is promoted to a hero; the rest
	fill a responsive grid; reached goals collapse into a quieter section below.
	Differentiation is typographic (size/weight/position), never color.

	Seeds the countdowns store from server data ONCE inside untrack() — the single
	hydration site (do not add another).
-->
<script lang="ts">
	import { untrack } from "svelte";
	import { page } from "$app/state";
	import { countdowns } from "$lib/stores/countdowns.svelte";
	import { ai } from "$lib/stores/ai.svelte";
	import { reveal } from "$lib/motion";
	import { Cta } from "$lib/ds";
	import User from "$src/components/User.svelte";
	import CountdownHero from "$src/components/CountdownHero.svelte";
	import CountdownCard from "$src/components/CountdownCard.svelte";
	import EmptyState from "$src/components/EmptyState.svelte";
	import CountdownComposerDialog from "$src/components/CountdownComposerDialog.svelte";
	import ShareDialog from "$src/components/ShareDialog.svelte";
	import type { Countdown, CountdownInput } from "$lib/types";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	// INVARIANT: the ONLY store-hydration site. Seeds from server data without
	// registering it as a reactive dependency of this render.
	untrack(() => {
		countdowns.hydrate({ countdowns: data.appState.countdowns });
		ai.hydrate(data.ai);
	});

	let composerOpen = $state(false);
	let editing = $state<Countdown | null>(null);
	let shareOpen = $state(false);
	let shareId = $state<string | null>(null);

	const openNew = () => {
		editing = null;
		composerOpen = true;
	};
	const openEdit = (c: Countdown) => {
		editing = c;
		composerOpen = true;
	};
	const openShare = (id: string) => {
		shareId = id;
		shareOpen = true;
	};
	const onSave = async (input: CountdownInput, id: string | null) => {
		if (id) countdowns.update(id, input);
		else await countdowns.add(input);
	};

	const isEmpty = $derived(countdowns.active.length === 0);
	const gridItems = $derived(countdowns.upcoming.slice(1)); // hero is upcoming[0]
</script>

{#if page.data.user && page.data.currentUser}
	<User user={page.data.user} currentUser={page.data.currentUser} />
{/if}

<main class="mx-auto flex w-full max-w-6xl grow flex-col px-4 pt-20 pb-12 sm:px-6 sm:pt-24">
	<header class="mb-12 flex items-end justify-between gap-4 sm:mb-16" use:reveal>
		<div>
			<p class="text-ink-muted font-mono text-micro tracking-[0.24em] uppercase">Dropout Studio · Countdowns</p>
			<h1
				class="text-foreground mt-1.5 font-sans text-title leading-none lowercase"
				style="font-variation-settings: 'wght' 600"
			>
				day zero
			</h1>
		</div>
		{#if !isEmpty}
			<Cta variant="primary" arrow={false} dot onclick={openNew} class="shrink-0">new</Cta>
		{/if}
	</header>

	{#if isEmpty}
		<EmptyState onNew={openNew} />
	{:else}
		{#if countdowns.hero}
			<section class="mb-16 sm:mb-24" use:reveal={{ distance: "sm" }}>
				<CountdownHero countdown={countdowns.hero} onEdit={openEdit} onShare={openShare} />
			</section>
		{/if}

		{#if gridItems.length}
			<section class="mb-16 space-y-6 sm:mb-20" use:reveal={{ distance: "sm", onScroll: true }}>
				<div class="flex items-center gap-3">
					<span class="text-ink-muted font-mono text-micro tracking-[0.24em] uppercase">Upcoming</span>
					<span class="bg-hair h-px grow" aria-hidden="true"></span>
					<span class="text-ink-muted font-mono text-micro tabular-nums">{gridItems.length}</span>
				</div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each gridItems as c (c.id)}
						<CountdownCard countdown={c} onEdit={openEdit} onShare={openShare} />
					{/each}
				</div>
			</section>
		{/if}

		{#if countdowns.past.length}
			<section class="space-y-6" use:reveal={{ distance: "sm", onScroll: true }}>
				<div class="flex items-center gap-3">
					<span class="text-ink-muted font-mono text-micro tracking-[0.24em] uppercase">Reached</span>
					<span class="bg-hair h-px grow" aria-hidden="true"></span>
					<span class="text-ink-muted font-mono text-micro tabular-nums">{countdowns.past.length}</span>
				</div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each countdowns.past as c (c.id)}
						<CountdownCard countdown={c} onEdit={openEdit} onShare={openShare} />
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</main>

<CountdownComposerDialog bind:open={composerOpen} {editing} {onSave} />
<ShareDialog bind:open={shareOpen} id={shareId} />
