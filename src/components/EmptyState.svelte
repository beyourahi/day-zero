<!--
	First-run empty state. On-voice, inviting, monochrome. The primary CTA is the
	one bright thing on the page.
-->
<script lang="ts">
	import { Heading, Eyebrow, Cta } from "$lib/ds";

	let { onNew }: { onNew: () => void } = $props();
</script>

<div class="flex grow flex-col items-center justify-center gap-6 py-24 text-center sm:gap-7">
	<Eyebrow>Day Zero</Eyebrow>
	<Heading as="h2" size="title" weight={580} class="max-w-md text-balance lowercase">
		nothing on the clock yet
	</Heading>
	<p class="text-ink-muted max-w-sm text-label text-pretty">
		add the first thing you're counting toward — a launch, an exam, a deadline. whatever actually matters.
	</p>
	<Cta variant="primary" arrow={false} dot onclick={onNew}>new countdown</Cta>
</div>
