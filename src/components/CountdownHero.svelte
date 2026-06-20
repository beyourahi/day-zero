<!--
	The hero — the single soonest upcoming countdown, promoted to a centered stage.
	Oversized variable-weight numerals, a lowercase title, and a mono eyebrow with
	the target date plus the one allowed accent: a live signal pulse. Quiet
	edit/share actions sit beneath, never out-shouting the digits.
-->
<script lang="ts">
	import { formatTargetDate } from "$lib/countdown/format";
	import { Heading } from "$lib/ds";
	import CountdownDisplay from "./CountdownDisplay.svelte";
	import { Pencil, Share2 } from "@lucide/svelte";
	import type { Countdown } from "$lib/types";

	let {
		countdown,
		onEdit,
		onShare
	}: {
		countdown: Countdown;
		onEdit: (c: Countdown) => void;
		onShare: (id: string) => void;
	} = $props();
</script>

<div class="flex flex-col items-center gap-7 text-center sm:gap-9">
	<div class="flex items-center gap-2.5">
		<span
			class="bg-signal size-[7px] shrink-0 rounded-full motion-safe:animate-[ctaPulse_2.8s_var(--ease)_infinite]"
			aria-hidden="true"
		></span>
		<p class="text-ink-muted font-mono text-micro tracking-[0.26em] uppercase">
			Next up · {formatTargetDate(countdown.targetAt, countdown.hasTime)}
		</p>
	</div>

	<Heading as="h2" size="title-lg" weight={600} class="max-w-2xl text-balance lowercase">
		{countdown.title}
	</Heading>

	<CountdownDisplay targetAt={countdown.targetAt} hasTime={countdown.hasTime} size="hero" align="center" />

	<div class="flex items-center gap-1.5">
		<button
			type="button"
			class="text-ink-muted pointer-fine:hover:text-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-micro tracking-[0.16em] uppercase transition-colors"
			onclick={() => onEdit(countdown)}
		>
			<Pencil size={13} aria-hidden="true" /> Edit
		</button>
		<button
			type="button"
			class="text-ink-muted pointer-fine:hover:text-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-micro tracking-[0.16em] uppercase transition-colors"
			onclick={() => onShare(countdown.id)}
		>
			<Share2 size={13} aria-hidden="true" /> Share
		</button>
	</div>
</div>
