<!--
	The shared countdown digits — the single rendering unit used by the hero, the
	grid cards, and the public share view (one component, three sizes). Reads the
	shared clock so all instances tick from one interval. Days are never zero-padded
	(can be 3+ digits); hours/minutes/seconds pad to two. Past targets render a
	"reached" state with elapsed-since.

	Per the DS countdown lesson: digits use plain Tailwind text-size classes (not
	the DS text-* tokens), tabular-nums for non-jittery ticking, and unit labels use
	plain mono class strings so nothing gets merged away.
-->
<script lang="ts">
	import { clock } from "$lib/stores/clock.svelte";
	import { remaining, humanize, pad2 } from "$lib/countdown/format";
	import { cn } from "$lib/utils";

	type Size = "hero" | "card" | "share";

	let {
		targetAt,
		hasTime,
		size = "card",
		align = "center"
	}: {
		targetAt: string;
		hasTime: boolean;
		size?: Size;
		align?: "center" | "start";
	} = $props();

	const targetMs = $derived(Date.parse(targetAt));
	const r = $derived(remaining(targetMs, clock.now, hasTime));

	const cfg: Record<Size, { digit: string; label: string; gap: string }> = {
		hero: {
			digit: "text-5xl sm:text-7xl lg:text-8xl",
			label: "mt-2 text-[10px] sm:text-[11px]",
			gap: "gap-5 sm:gap-8 lg:gap-10"
		},
		card: {
			digit: "text-[1.75rem] sm:text-3xl",
			label: "mt-1.5 text-[8.5px] sm:text-[9px]",
			gap: "gap-3 sm:gap-4"
		},
		share: {
			digit: "text-6xl sm:text-8xl lg:text-[8.5rem]",
			label: "mt-2.5 text-[11px] sm:text-xs",
			gap: "gap-6 sm:gap-10 lg:gap-14"
		}
	};
	const c = $derived(cfg[size]);
	const alignClass = $derived(align === "center" ? "items-center" : "items-start");

	const digit = (unit: string, value: number) => (unit === "days" ? String(value) : pad2(value));
</script>

{#if r.isPast}
	<div class={cn("flex flex-col", alignClass)}>
		<span
			class={cn("text-foreground font-sans leading-none lowercase", c.digit)}
			style="font-variation-settings: 'wght' 560"
		>
			reached
		</span>
		<span class={cn("text-ink-muted font-mono tracking-[0.22em] uppercase tabular-nums", c.label)}>
			{humanize(targetMs, clock.now, hasTime)}
		</span>
	</div>
{:else}
	<div
		class={cn("flex flex-wrap tabular-nums", alignClass, align === "center" && "justify-center", c.gap)}
		role="timer"
		aria-label="time remaining"
	>
		{#each r.segments as seg (seg.unit)}
			<div class={cn("flex flex-col", align === "center" ? "items-center" : "items-start")}>
				<span
					class={cn("text-foreground font-sans leading-none", c.digit)}
					style="font-variation-settings: 'wght' 580"
				>
					{digit(seg.unit, seg.value)}
				</span>
				<span class={cn("text-ink-muted font-mono tracking-[0.22em] uppercase", c.label)}>
					{seg.label}
				</span>
			</div>
		{/each}
	</div>
{/if}
