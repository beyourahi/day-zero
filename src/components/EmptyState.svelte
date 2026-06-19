<!--
	First-run empty state. On-voice, inviting, monochrome. The primary CTA is the
	one bright thing on the page.
-->
<script lang="ts">
	import { Heading, Cta } from "$lib/ds";

	let { onNew }: { onNew: () => void } = $props();
</script>

<div class="flex grow flex-col items-center justify-center gap-6 py-24 text-center sm:gap-7">
	<Heading as="h2" size="title" weight={580} class="max-w-md text-balance lowercase">
		nothing on the clock yet
	</Heading>
	<Cta variant="primary" arrow={false} dot onclick={onNew}>new countdown</Cta>
</div>
