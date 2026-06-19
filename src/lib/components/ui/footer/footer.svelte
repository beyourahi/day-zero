<!--
	Global footer. Hairline top border, mono uppercase wide-tracked links per the
	Dropout editorial law; muted at rest, foreground on hover. Hand-authored (not a
	shadcn primitive) — the sole editable file under ui/. All links/hrefs preserved.
-->
<script lang="ts">
	import { APP_CONFIG } from "$lib/config";
</script>

<footer
	class="border-hair text-ink-muted flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t px-4 py-8 font-mono text-micro tracking-[0.22em] uppercase sm:px-6 sm:py-10"
>
	<p class="flex flex-wrap items-center gap-x-3 gap-y-2">
		<a
			href="/changelog"
			class="ease-[var(--ease)] whitespace-nowrap transition-colors pointer-fine:hover:text-foreground"
		>
			Changelog
		</a>
		<span class="text-hair" aria-hidden="true">/</span>
		<a
			href="https://dropoutstudio.co/tools"
			target="_blank"
			rel="noopener noreferrer"
			class="ease-[var(--ease)] whitespace-nowrap transition-colors pointer-fine:hover:text-foreground"
		>
			Other tools
		</a>
	</p>
	<p>
		<a
			href={APP_CONFIG.author.url}
			target="_blank"
			rel="noopener noreferrer"
			class="ease-[var(--ease)] whitespace-nowrap transition-colors pointer-fine:hover:text-foreground"
		>
			Designed by {APP_CONFIG.author.name}
		</a>
	</p>
</footer>
