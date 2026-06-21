<!--
	A single countdown in the grid. Hairline surface, lowercase title, target-date
	eyebrow, the compact ticking display, and an at-rest action row (edit / share /
	archive / delete) — visible without hover so it works on touch. Delete is a
	two-step inline confirm (no modal) to prevent accidents. A past countdown dims
	and its display switches to the "reached" state automatically.
-->
<script lang="ts">
	import { clock } from "$lib/stores/clock.svelte";
	import { countdowns } from "$lib/stores/countdowns.svelte";
	import { remaining, formatTargetDate } from "$lib/countdown/format";
	import { cn } from "$lib/utils";
	import CountdownDisplay from "./CountdownDisplay.svelte";
	import { Pencil, Share2, Archive, Trash2, Check } from "@lucide/svelte";
	import type { Countdown } from "$lib/types";

	let {
		countdown,
		onEdit,
		onShare,
		canShare = true
	}: {
		countdown: Countdown;
		onEdit: (c: Countdown) => void;
		onShare: (id: string) => void;
		/** Sharing needs a server token — hidden for logged-out (guest) boards. */
		canShare?: boolean;
	} = $props();

	const isPast = $derived(remaining(Date.parse(countdown.targetAt), clock.now, countdown.hasTime).isPast);

	let confirmingDelete = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout> | undefined;

	const requestDelete = () => {
		if (confirmingDelete) {
			clearTimeout(confirmTimer);
			countdowns.remove(countdown.id);
			return;
		}
		confirmingDelete = true;
		confirmTimer = setTimeout(() => (confirmingDelete = false), 3000);
	};

	const actionBtn =
		"text-ink-muted hover:text-foreground rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";
</script>

<div
	class={cn(
		"group border-hair relative flex flex-col gap-4 rounded-2xl border bg-white/[0.02] p-5 transition-[border-color,opacity] duration-[250ms] ease-[var(--ease)] hover:border-white/15",
		isPast && "opacity-65"
	)}
>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<h3 class="text-foreground truncate font-sans text-lead font-semibold lowercase" title={countdown.title}>
				{countdown.title}
			</h3>
			<p class="text-ink-muted mt-1 font-mono text-micro tracking-[0.18em] uppercase">
				{formatTargetDate(countdown.targetAt, countdown.hasTime)}
			</p>
		</div>

		<div class="flex shrink-0 items-center gap-0.5">
			<button type="button" class={actionBtn} aria-label="Edit" onclick={() => onEdit(countdown)}>
				<Pencil size={15} aria-hidden="true" />
			</button>
			{#if canShare}
				<button
					type="button"
					class={cn(actionBtn, countdown.shareToken && "text-signal hover:text-signal")}
					aria-label={countdown.shareToken ? "Shared — manage link" : "Share"}
					onclick={() => onShare(countdown.id)}
				>
					<Share2 size={15} aria-hidden="true" />
				</button>
			{/if}
			<button
				type="button"
				class={actionBtn}
				aria-label={countdown.archived ? "Unarchive" : "Archive"}
				onclick={() => countdowns.setArchived(countdown.id, !countdown.archived)}
			>
				<Archive size={15} aria-hidden="true" />
			</button>
			<button
				type="button"
				class={cn(actionBtn, confirmingDelete && "text-destructive hover:text-destructive")}
				aria-label={confirmingDelete ? "Confirm delete" : "Delete"}
				onclick={requestDelete}
			>
				{#if confirmingDelete}
					<Check size={15} aria-hidden="true" />
				{:else}
					<Trash2 size={15} aria-hidden="true" />
				{/if}
			</button>
		</div>
	</div>

	<CountdownDisplay targetAt={countdown.targetAt} hasTime={countdown.hasTime} size="card" align="start" />
</div>
