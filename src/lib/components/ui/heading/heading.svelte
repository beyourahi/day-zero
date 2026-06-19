<!--
	Brand lockup for the login screen. Editorial DS: mono eyebrow, oversized
	lowercase variable-weight wordmark, muted tagline. Dark-only, monochrome.
-->
<script lang="ts">
	import { Heading, Eyebrow } from "$lib/ds";
</script>

<div class="flex flex-col items-center gap-4 text-center sm:gap-5">
	<Eyebrow>Dropout Studio</Eyebrow>
	<Heading as="h1" size="display" weight={620} numeral class="lowercase">day zero</Heading>
	<p class="text-ink-muted text-label text-pretty sm:text-body">
		count down to the things that actually matter.
	</p>
</div>
