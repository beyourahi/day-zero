<!--
	Public changelog page. Renders the static CHANGELOG_ENTRIES grouped by date
	(newest first; the array is already newest-first so no sort runs here). No
	+page.server.ts sits beside this file, which keeps the route public — there is
	no auth guard. Dates are formatted absolutely (SSR-safe; never relative) so
	server and client output match. Editorial DS styling: mono Eyebrow + lowercase
	Heading header, hairline date separators, monochrome throughout.
-->
<script lang="ts">
	import { CHANGELOG_ENTRIES, type ChangelogEntry } from "$lib/data/changelog";
	import { reveal } from "$lib/motion";
	import { Heading, Eyebrow } from "$lib/ds";

	type DateGroup = { date: string; label: string; entries: ChangelogEntry[] };

	const dateFormatter = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric"
	});

	// Preserve the source order (newest first) while collapsing consecutive
	// entries that share a date into a single dated group.
	const groups: DateGroup[] = (() => {
		const out: DateGroup[] = [];
		for (const entry of CHANGELOG_ENTRIES) {
			const last = out[out.length - 1];
			if (last && last.date === entry.date) {
				last.entries.push(entry);
				continue;
			}
			out.push({
				date: entry.date,
				label: dateFormatter.format(new Date(`${entry.date}T00:00:00`)),
				entries: [entry]
			});
		}
		return out;
	})();
</script>

<svelte:head>
	<title>Changelog · Day Zero</title>
	<meta
		name="description"
		content="A plain-language record of every meaningful update to Day Zero — new features, improvements, and fixes."
	/>
</svelte:head>

<main class="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
	<header class="flex flex-col gap-4 sm:gap-5" use:reveal={{ distance: "sm" }}>
		<Eyebrow>What's new</Eyebrow>
		<Heading as="h1" size="title" weight={560} class="lowercase">changelog</Heading>
		<p class="text-ink-muted max-w-md text-label text-pretty sm:text-body">
			Every meaningful update to Day Zero, written in plain language.
		</p>
	</header>

	<div class="border-hair my-12 border-t sm:my-16"></div>

	<div class="space-y-14 sm:space-y-20">
		{#each groups as group, groupIndex (group.date)}
			<section class="space-y-6">
				<div
					class="flex flex-wrap items-baseline gap-x-3 gap-y-1.5"
					use:reveal={{ distance: "sm", delay: groupIndex === 0 ? 0.05 : 0 }}
				>
					<span class="text-ink-muted font-mono text-micro tracking-[0.28em] uppercase tabular-nums">
						{group.label}
					</span>
					{#if groupIndex === 0}
						<span
							class="border-hair text-ink-muted rounded-full border px-2 py-0.5 font-mono text-micro tracking-[0.18em] uppercase"
						>
							Latest
						</span>
					{/if}
				</div>

				<div class="border-hair space-y-8 border-l pl-5 sm:pl-6">
					{#each group.entries as entry, entryIndex (entry.title)}
						<article class="space-y-2.5" use:reveal={{ distance: "sm", delay: 0.06 * entryIndex }}>
							<span class="text-ink-muted block font-mono text-micro tracking-[0.22em] uppercase">
								{entry.category}
							</span>
							<Heading as="h2" size="lead" weight={560} class="text-balance">
								{entry.title}
							</Heading>
							<p class="text-ink-muted text-label leading-relaxed text-pretty">
								{entry.summary}
							</p>
						</article>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</main>
