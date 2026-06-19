<!--
	Create / edit composer. One dialog for both: pass `editing` to prefill. Fields
	are title, a target date, an optional time (Switch-gated), and an optional note.
	The local date+time is converted to an absolute UTC ISO instant on save; a
	date-only goal defaults to 00:00 local (the day arrives → zero). Native date/time
	inputs are styled with the DS input surface (color-scheme: dark) — accessible and
	dependency-free.
-->
<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Switch } from "$lib/components/ui/switch";
	import { Input, Cta, cn, inputBase, labelBase } from "$lib/ds";
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
	let dateStr = $state("");
	let timeStr = $state("");
	let withTime = $state(false);
	let note = $state("");
	let saving = $state(false);
	let wasOpen = false;

	const pad = (n: number) => String(n).padStart(2, "0");
	const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

	// Seed the form once each time the dialog transitions closed → open.
	$effect(() => {
		if (open && !wasOpen) {
			if (editing) {
				const d = new Date(editing.targetAt);
				title = editing.title;
				dateStr = toDateInput(d);
				withTime = editing.hasTime;
				timeStr = editing.hasTime ? toTimeInput(d) : "";
				note = editing.note;
			} else {
				title = "";
				dateStr = "";
				timeStr = "";
				withTime = false;
				note = "";
			}
		}
		wasOpen = open;
	});

	const canSave = $derived(title.trim().length > 0 && dateStr.length > 0 && !saving);

	const save = async () => {
		if (!canSave) return;
		const time = withTime && timeStr ? timeStr : "00:00";
		const local = new Date(`${dateStr}T${time}:00`);
		if (Number.isNaN(local.getTime())) return;
		saving = true;
		try {
			await onSave(
				{
					title: title.trim(),
					targetAt: local.toISOString(),
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
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 p-0 sm:max-w-md" showCloseButton={false}>
		<Dialog.Header class="border-hair border-b px-5 py-4">
			<Dialog.Title>
				<span class="font-sans text-lead lowercase">
					{editing ? "edit countdown" : "new countdown"}
				</span>
			</Dialog.Title>
			<Dialog.Description class="text-ink-muted text-caption">
				{editing ? "Adjust the goal or its target." : "What are you counting down to?"}
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-col gap-5 px-5 py-5">
			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class={labelBase}>Title</label>
				<Input bind:value={title} placeholder="e.g. Horcrux launch" maxlength={120} />
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class={labelBase}>Target date</label>
					<input type="date" bind:value={dateStr} class={cn(inputBase, "[color-scheme:dark]")} />
				</div>
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class={labelBase}>Time {withTime ? "" : "(optional)"}</label>
					<input
						type="time"
						bind:value={timeStr}
						disabled={!withTime}
						class={cn(inputBase, "[color-scheme:dark]", !withTime && "opacity-40")}
					/>
				</div>
			</div>

			<label class="flex items-center justify-between gap-3">
				<span class="text-ink-muted font-mono text-micro tracking-[0.18em] uppercase">
					Set a specific time
				</span>
				<Switch bind:checked={withTime} />
			</label>

			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class={labelBase}>Note (optional)</label>
				<textarea
					bind:value={note}
					rows="2"
					maxlength={500}
					placeholder="why it matters"
					class={cn(inputBase, "resize-none")}></textarea>
			</div>
		</div>

		<Dialog.Footer class="border-hair flex-row items-center justify-end gap-2 border-t px-5 py-4">
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
