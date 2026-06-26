<!--
	Global footer. Hairline top border, mono uppercase wide-tracked links per the
	Dropout editorial law; muted at rest, foreground on hover. Hand-authored (not a
	shadcn primitive) — the sole editable file under ui/. All links/hrefs preserved.
-->
<script lang="ts">
	import { APP_CONFIG } from "$lib/config/app";
</script>

<footer
	class="border-hair text-ink-muted flex w-full flex-col items-center justify-center gap-x-6 gap-y-3 border-t px-[var(--content-x)] py-8 text-center font-mono text-micro tracking-[0.22em] uppercase sm:flex-row sm:flex-wrap sm:justify-between sm:text-left sm:py-10"
>
	<p class="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
		<a
			href="/changelog"
			class="ease-[var(--ease)] whitespace-nowrap transition-colors pointer-fine:hover:text-foreground touch-manipulation"
		>
			Changelog
		</a>
		<span class="text-hair" aria-hidden="true">/</span>
		<a
			href="https://dropoutstudio.co/tools"
			target="_blank"
			rel="noopener noreferrer"
			class="ease-[var(--ease)] whitespace-nowrap transition-colors pointer-fine:hover:text-foreground touch-manipulation"
		>
			Other tools
		</a>
	</p>
	<p>
		<a
			href={APP_CONFIG.author.url}
			target="_blank"
			rel="noopener noreferrer"
			class="ease-[var(--ease)] whitespace-nowrap transition-colors pointer-fine:hover:text-foreground touch-manipulation"
		>
			Designed by {APP_CONFIG.author.name}
		</a>
	</p>
</footer>
