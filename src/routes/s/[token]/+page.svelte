<!--
	Public read-only share view. Reuses the same CountdownDisplay as the board (one
	component, two contexts), full-bleed and centered. Dynamic OG/Twitter meta so the
	link previews with the title + remaining time. A secondary ↗ CTA invites the
	viewer to make their own.
-->
<script lang="ts">
	import { page } from "$app/state";
	import { clock } from "$lib/stores/clock.svelte";
	import { Heading, Cta } from "$lib/ds";
	import { formatTargetDate, humanize } from "$lib/countdown/format";
	import CountdownDisplay from "$src/components/CountdownDisplay.svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	const cd = $derived(data.countdown);

	const ogDescription = $derived(`${cd.title} — ${humanize(Date.parse(cd.targetAt), clock.now, cd.hasTime)}`);
	const ogTitle = $derived(`${cd.title} · Day Zero`);
</script>

<svelte:head>
	<title>{ogTitle}</title>
	<meta name="description" content={ogDescription} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={ogDescription} />
</svelte:head>

<main class="flex grow flex-col items-center justify-center gap-12 px-4 py-20 text-center sm:gap-16">
	<div class="flex flex-col items-center gap-5 sm:gap-7">
		<div class="flex items-center gap-2.5">
			<span
				class="bg-signal size-[7px] shrink-0 rounded-full motion-safe:animate-[ctaPulse_2.8s_var(--ease)_infinite]"
				aria-hidden="true"
			></span>
			<p class="text-ink-muted font-mono text-micro tracking-[0.26em] uppercase">
				{formatTargetDate(cd.targetAt, cd.hasTime)}
			</p>
		</div>

		<Heading as="h1" size="title-lg" weight={600} class="max-w-2xl text-balance lowercase">
			{cd.title}
		</Heading>

		<CountdownDisplay targetAt={cd.targetAt} hasTime={cd.hasTime} size="share" align="center" />
	</div>

	<div class="flex flex-col items-center gap-5">
		<Cta variant="secondary" href="/">make your own</Cta>
		<p class="text-ink-muted font-mono text-micro tracking-[0.22em] uppercase">by dropout studio</p>
	</div>
</main>
