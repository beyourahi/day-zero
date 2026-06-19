<!--
	Create / edit composer. One dialog for both: pass `editing` to prefill. Fields
	are a title, a target date (DS calendar), an optional exact time (Switch-gated
	hour/minute selects), and an optional note. The picked local date+time is
	converted to an absolute UTC ISO instant on save; a date-only goal defaults to
	00:00 local (the day arrives → zero).

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
	let hourStr = $state("09");
	let minStr = $state("00");
	let withTime = $state(false);
	let note = $state("");
	let saving = $state(false);
	let wasOpen = false;

	const pad = (n: number) => String(n).padStart(2, "0");
	const hours = Array.from({ length: 24 }, (_, i) => pad(i));
	const minutes = Array.from({ length: 60 }, (_, i) => pad(i));

	// New countdowns can't target a past day; an existing goal may already be past,
	// so editing leaves the calendar unconstrained.
	const minDate = $derived(editing ? undefined : today(getLocalTimeZone()));

	// Resolve the picked date + (optional) time to the absolute instant we'll save,
	// reused for the live summary line so the user sees exactly what lands.
	const resolvedIso = $derived.by(() => {
		if (!dateValue) return null;
		const h = withTime ? Number(hourStr) : 0;
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
				hourStr = pad(d.getHours());
				minStr = pad(d.getMinutes());
				note = editing.note;
			} else {
				title = "";
				dateValue = undefined;
				placeholder = today(getLocalTimeZone());
				withTime = false;
				hourStr = "09";
				minStr = "00";
				note = "";
			}
		}
		wasOpen = open;
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
					hasTime: withTime,
					note: note.trim()
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
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md" showCloseButton={false}>
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

		<div class="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
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
					<div class="flex items-center gap-2">
						<div class="flex-1">
							<Select.Root type="single" bind:value={hourStr}>
								<Select.Trigger class={timeTrigger} aria-label="Hour">
									{hourStr}
								</Select.Trigger>
								<Select.Content class="max-h-56">
									{#each hours as h (h)}
										<Select.Item value={h} label={h} class="font-mono tabular-nums" />
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
						<span class="text-ink-muted font-mono text-lead">:</span>
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
					</div>
				{/if}
			</div>

			{#if summary}
				<p
					class="border-hair text-ink-muted rounded-[11px] border border-dashed px-4 py-3 text-center font-mono text-[11px] tracking-[0.04em]"
				>
					counting down to <span class="text-foreground">{summary}</span>
				</p>
			{/if}

			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class={labelBase}>Note (optional)</label>
				<textarea
					bind:value={note}
					rows="2"
					maxlength={500}
					placeholder="a line on why it matters"
					class={cn(inputBase, "resize-none")}></textarea>
			</div>
		</div>

		<Dialog.Footer
			class="border-hair mx-0 mb-0 shrink-0 flex-row items-center justify-end gap-2 border-t px-5 py-4"
		>
			<Dialog.Close
				class="text-ink-muted hover:text-foreground rounded-full px-4 py-2 font-mono text-micro tracking-[0.14em] uppercase transition-colors"
			>
				Cancel
			</Dialog.Close>
			<Cta variant="primary" arrow={false} onclick={save} disabled={!canSave}>
				{saving ? "Saving…" : editing ? "Save" : "Create"}
			</Cta>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
