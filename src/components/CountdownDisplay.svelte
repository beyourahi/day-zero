<!--
	The shared countdown digits — the single rendering unit used by the hero, the
	grid cards, and the public share view (one component, three sizes). Reads the
	shared clock so all instances tick from one interval. Days are never zero-padded
	(can be 3+ digits); hours/minutes/seconds pad to two. Past targets render a
	"reached" state with elapsed-since.

	Presentation mirrors the Dropout "Horcrux Incentives" countdown: each unit is a
	bordered, gradient-filled, overflow-clipped BOX holding a mono bold tabular-nums
	digit, with a colon between units, an uppercase mono label below, and a soft
	radial glow behind the row. On every value change the incoming digit replays the
	`countdownTick` keyframe (slide down from above + fade), clipped by the box top —
	the {#key seg.value} block remounts the span so the animation re-fires. The
	`motion-safe:` variant withholds the slide under prefers-reduced-motion.

	Per the DS countdown lesson: digits use plain Tailwind text-size classes (not the
	DS text-* tokens), tabular-nums for non-jittery ticking, and class strings are
	composed so nothing gets merged away (one base + one size fragment per element,
	with non-overlapping properties).
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

	// Shared boxed treatment — the look is identical across sizes; only the scale
	// fragments in `cfg` change. surfaceBase owns the surface (border/gradient/
	// shadow); the radius and padding live in cfg so twMerge never collapses
	// anything. boxBase adds the overflow-clip that makes the slide-in animation
	// read — used ONLY for the live digit boxes. The "reached" box uses surfaceBase
	// (no clip) so its word never gets cut off in a narrow card.
	const surfaceBase =
		"relative border border-hair bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.015))] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_2px_6px_-2px_rgba(0,0,0,0.5)]";
	const boxBase = surfaceBase + " overflow-hidden";
	const digitBase = "block font-mono leading-none font-bold text-foreground tabular-nums";
	const labelBase = "font-mono text-ink-muted uppercase";
	const colonBase = "font-mono leading-none font-bold text-ink-muted";

	// Per-size scale. `hero` is anchored to the reference's exact clamps; `card`
	// scales down (fixed px for the small 3-up grid cards); `share` scales up for
	// the dedicated full-screen page. Each colon `pt` centers it on the box (not the
	// label), tuned to that size's box `py`.
	const cfg: Record<
		Size,
		{ container: string; group: string; box: string; digit: string; label: string; colon: string }
	> = {
		hero: {
			container: "gap-[clamp(6px,1.4vw,16px)] max-[480px]:gap-[7px]",
			group: "flex min-w-0 flex-col items-center gap-2.5 max-[480px]:flex-1",
			box: "min-w-[clamp(58px,9vw,96px)] rounded-[14px] px-[clamp(12px,2vw,22px)] py-[clamp(10px,1.6vw,18px)] max-[480px]:w-full max-[480px]:min-w-0 max-[480px]:px-1 max-[480px]:py-[11px]",
			digit: "text-[clamp(26px,5vw,48px)]",
			label: "text-[10px]",
			colon: "self-start pt-[clamp(18px,3vw,34px)] text-[clamp(20px,3.6vw,36px)] max-[480px]:hidden"
		},
		card: {
			container: "gap-2 sm:gap-2.5",
			group: "flex min-w-0 flex-col items-center gap-1.5",
			box: "min-w-[44px] rounded-[10px] px-2 py-2 sm:min-w-[52px] sm:px-2.5 sm:py-2.5",
			digit: "text-[1.5rem] sm:text-[1.75rem]",
			label: "text-[9px]",
			colon: "self-start pt-[9px] text-[1.1rem] sm:pt-[11px] sm:text-[1.3rem] max-[420px]:hidden"
		},
		share: {
			container: "gap-[clamp(8px,1.8vw,22px)] max-[480px]:gap-2",
			group: "flex min-w-0 flex-col items-center gap-3 max-[480px]:flex-1",
			box: "min-w-[clamp(72px,12vw,140px)] rounded-[18px] px-[clamp(16px,2.6vw,32px)] py-[clamp(14px,2.2vw,28px)] max-[480px]:w-full max-[480px]:min-w-0 max-[480px]:px-2 max-[480px]:py-[13px]",
			digit: "text-[clamp(34px,7vw,72px)]",
			label: "text-[11px] sm:text-xs",
			colon: "self-start pt-[clamp(24px,4vw,52px)] text-[clamp(26px,5vw,52px)] max-[480px]:hidden"
		}
	};
	const c = $derived(cfg[size]);
	const justify = $derived(align === "center" ? "justify-center" : "justify-start");

	// Fixed unit labels matching the reference (days / hrs / min / sec) — rendered
	// uppercase. Presentation-only: format.ts keeps its grammatical pluralization
	// for other consumers (humanize); only the displayed glyph is overridden here.
	const LABELS: Record<string, string> = { days: "days", hours: "hrs", minutes: "min", seconds: "sec" };

	const digit = (unit: string, value: number) => (unit === "days" ? String(value) : pad2(value));
</script>

{#if r.isPast}
	<div class={cn("relative flex", justify)}>
		<div class={cn(surfaceBase, c.box, "flex flex-col items-center gap-1.5 text-center")}>
			<span
				class={cn("block font-mono leading-none font-bold text-foreground lowercase", c.digit)}
			>
				reached
			</span>
			<span class={cn(labelBase, c.label, "tabular-nums")}>
				{humanize(targetMs, clock.now, hasTime)}
			</span>
		</div>
	</div>
{:else}
	<div class={cn("relative", align === "center" && "w-full")}>
		<span
			aria-hidden="true"
			class="pointer-events-none absolute top-1/2 left-1/2 h-[150%] w-[115%] -translate-x-1/2 -translate-y-1/2"
			style="background:radial-gradient(closest-side, rgba(255,255,255,0.055), transparent 72%);"
		></span>
		<div
			class={cn("relative z-[1] flex items-start", justify, c.container)}
			role="timer"
			aria-label="time remaining"
		>
			{#each r.segments as seg, i (seg.unit)}
				{#if i > 0}
					<span class={cn(colonBase, c.colon)}>:</span>
				{/if}
				<div class={c.group}>
					<div class={cn(boxBase, c.box)}>
						{#key seg.value}
							<span class={cn(digitBase, c.digit, "motion-safe:animate-[countdownTick_0.5s_var(--ease)]")}>
								{digit(seg.unit, seg.value)}
							</span>
						{/key}
					</div>
					<span class={cn(labelBase, c.label)}>{LABELS[seg.unit] ?? seg.label}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
