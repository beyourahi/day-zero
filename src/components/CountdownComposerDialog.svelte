<!--
	Create / edit composer. One dialog for both: pass `editing` to prefill. Fields
	are a title, a target date (DS calendar), and an optional exact time (Switch-gated
	hour/minute selects). The picked local date+time is converted to an absolute UTC
	ISO instant on save; a date-only goal defaults to 00:00 local (the day arrives → zero).

	Layout: a fixed header + footer with a scrollable body between, so the dialog
	stays bounded on short viewports. The footer carries `mx-0 mb-0` to cancel the
	shadcn dialog-footer's baked-in negative margins (which assume the Content's
	default p-4 — this Content is p-0), and the Content is `overflow-hidden` so
	every band clips to the rounded corners.
-->
<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Select from "$lib/components/ui/select";
	import { Switch } from "$lib/components/ui/switch";
	import CountdownCalendar from "$src/components/CountdownCalendar.svelte";
	import { Input, Cta, cn, inputBase, labelBase } from "$lib/ds";
	import { formatTargetDate } from "$lib/countdown/format";
	import { lockScroll } from "$lib/hooks";
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from "@internationalized/date";
	import type { Countdown, CountdownInput } from "$lib/types";

	let {
		open = $bindable(false),
		editing = null,
		onSave
	}: {
		open?: boolean;
		editing?: Countdown | null;
		onSave: (input: CountdownInput, id: string | null) => void | Promise<void>;
	} = $props();

	let title = $state("");
	let dateValue = $state<DateValue | undefined>(undefined);
	let placeholder = $state<DateValue | undefined>(undefined);
	let hour12 = $state("9");
	let minStr = $state("00");
	let meridiem = $state<"AM" | "PM">("AM");
	let withTime = $state(false);
	let saving = $state(false);
	let wasOpen = false;

	const pad = (n: number) => String(n).padStart(2, "0");
	// 12-hour clock values (minute stays zero-padded). The picked 12h value + AM/PM
	// map to a 0–23 hour only when the absolute instant is built (and back, on edit),
	// so the stored UTC instant is unchanged by this display format.
	const hours = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i));
	const minutes = Array.from({ length: 60 }, (_, i) => pad(i));

	const to24 = (h12: number, mer: "AM" | "PM") =>
		mer === "AM" ? (h12 === 12 ? 0 : h12) : h12 === 12 ? 12 : h12 + 12;
	const from24 = (h24: number): { h12: string; mer: "AM" | "PM" } => ({
		h12: String(h24 % 12 === 0 ? 12 : h24 % 12),
		mer: h24 < 12 ? "AM" : "PM"
	});

	// New countdowns can't target a past day; an existing goal may already be past,
	// so editing leaves the calendar unconstrained.
	const minDate = $derived(editing ? undefined : today(getLocalTimeZone()));

	// Resolve the picked date + (optional) time to the absolute instant we'll save,
	// reused for the live summary line so the user sees exactly what lands.
	const resolvedIso = $derived.by(() => {
		if (!dateValue) return null;
		const h = withTime ? to24(Number(hour12), meridiem) : 0;
		const m = withTime ? Number(minStr) : 0;
		const local = new Date(dateValue.year, dateValue.month - 1, dateValue.day, h, m, 0, 0);
		return Number.isNaN(local.getTime()) ? null : local.toISOString();
	});
	const summary = $derived(resolvedIso ? formatTargetDate(resolvedIso, withTime) : null);

	// Seed the form once each time the dialog transitions closed → open.
	$effect(() => {
		if (open && !wasOpen) {
			if (editing) {
				const d = new Date(editing.targetAt);
				title = editing.title;
				dateValue = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
				placeholder = dateValue;
				withTime = editing.hasTime;
				const { h12, mer } = from24(d.getHours());
				hour12 = h12;
				meridiem = mer;
				minStr = pad(d.getMinutes());
			} else {
				title = "";
				dateValue = undefined;
				placeholder = today(getLocalTimeZone());
				withTime = false;
				hour12 = "9";
				meridiem = "AM";
				minStr = "00";
			}
		}
		wasOpen = open;
	});

	// Lock background scroll while open. bits-ui's own preventScroll locks <body>,
	// but `html { overflow-x: clip }` (app.css) keeps <html> the viewport scroller,
	// so we own the lock here and disable bits-ui's (preventScroll={false} below) to
	// avoid double scrollbar compensation. Releases on close / unmount.
	$effect(() => {
		if (!open) return;
		return lockScroll();
	});

	const canSave = $derived(title.trim().length > 0 && !!resolvedIso && !saving);

	const save = async () => {
		if (!canSave || !resolvedIso) return;
		saving = true;
		try {
			await onSave(
				{
					title: title.trim(),
					targetAt: resolvedIso,
					hasTime: withTime
				},
				editing?.id ?? null
			);
			open = false;
		} finally {
			saving = false;
		}
	};

	// Select trigger dressed as a DS input surface (inputBase), height freed from
	// the shadcn h-8 variant so it matches the title field.
	const timeTrigger = cn(inputBase, "flex !h-auto items-center justify-between gap-2 tabular-nums");

	// Segmented AM/PM control — same DS vocabulary as the calendar's selected day
	// (signal fill for the active half, quiet ink for the other), sized to sit flush
	// with the hour/minute select triggers.
	const meridiemBtn =
		"flex items-center px-3.5 font-mono text-caption tracking-[0.12em] uppercase transition-colors duration-200 ease-[var(--ease)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal touch-manipulation whitespace-nowrap";
	const meridiemOn = "bg-signal font-semibold text-background";
	const meridiemOff = "text-ink-muted hover:bg-white/[0.04] hover:text-foreground";
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
		showCloseButton={false}
		preventScroll={false}
	>
		<Dialog.Header class="border-hair shrink-0 border-b px-5 py-4">
			<Dialog.Title>
				<span class="font-sans text-lead lowercase">
					{editing ? "edit countdown" : "new countdown"}
				</span>
			</Dialog.Title>
			<Dialog.Description class="text-ink-muted text-caption">
				{editing ? "Tweak the goal or shift the date." : "What are you counting down to?"}
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 py-5">
			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class={labelBase}>Title</label>
				<Input bind:value={title} placeholder="e.g. Trip of a lifetime" maxlength={120} />
			</div>

			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class={labelBase}>Target date</label>
				<CountdownCalendar bind:value={dateValue} bind:placeholder minValue={minDate} />
			</div>

			<div class="flex flex-col gap-3">
				<label class="flex items-center justify-between gap-3">
					<span class="text-ink-muted font-mono text-micro tracking-[0.18em] uppercase">
						Set a specific time
					</span>
					<Switch bind:checked={withTime} />
				</label>

				{#if withTime}
					<div class="flex flex-wrap items-stretch gap-2">
						<div class="flex-1">
							<Select.Root type="single" bind:value={hour12}>
								<Select.Trigger class={timeTrigger} aria-label="Hour">
									{hour12}
								</Select.Trigger>
								<Select.Content class="max-h-56">
									{#each hours as h (h)}
										<Select.Item value={h} label={h} class="font-mono tabular-nums" />
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
						<span class="text-ink-muted self-center font-mono text-lead">:</span>
						<div class="flex-1">
							<Select.Root type="single" bind:value={minStr}>
								<Select.Trigger class={timeTrigger} aria-label="Minute">
									{minStr}
								</Select.Trigger>
								<Select.Content class="max-h-56">
									{#each minutes as m (m)}
										<Select.Item value={m} label={m} class="font-mono tabular-nums" />
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
						<div
							role="group"
							aria-label="Before or after noon"
							class="border-hair flex shrink-0 overflow-hidden rounded-[11px] border"
						>
							<button
								type="button"
								aria-pressed={meridiem === "AM"}
								onclick={() => (meridiem = "AM")}
								class={cn(meridiemBtn, meridiem === "AM" ? meridiemOn : meridiemOff)}
							>
								AM
							</button>
							<button
								type="button"
								aria-pressed={meridiem === "PM"}
								onclick={() => (meridiem = "PM")}
								class={cn(
									meridiemBtn,
									"border-hair border-l",
									meridiem === "PM" ? meridiemOn : meridiemOff
								)}
							>
								PM
							</button>
						</div>
					</div>
				{/if}
			</div>

			{#if summary}
				<p
					class="border-hair text-ink-muted rounded-sm border border-dashed px-4 py-3 text-center font-mono text-caption tracking-[0.04em] text-pretty"
				>
					counting down to <span class="text-foreground">{summary}</span>
				</p>
			{/if}
		</div>

		<Dialog.Footer
			class="border-hair mx-0 mb-0 shrink-0 flex-row items-center justify-end gap-2 border-t px-5 py-4"
		>
			<Dialog.Close
				class="text-ink-muted hover:text-foreground rounded-full px-4 py-2 font-mono text-micro tracking-[0.14em] uppercase transition-colors touch-manipulation whitespace-nowrap"
			>
				Cancel
			</Dialog.Close>
			<Cta variant="primary" arrow={false} onclick={save} disabled={!canSave}>
				{saving ? "Saving…" : editing ? "Save" : "Create"}
			</Cta>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
