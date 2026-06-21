<!--
	Logged-out counterpart to <User>: a fixed top-right pill inviting (not forcing)
	sign-in. Auth is optional — guests keep a full local board (localStorage); signing
	in adds cross-device sync, shareable links, and the AI copilot. Mirrors the avatar's
	`sleek border-hair bg-card` treatment so the corner reads consistently either way.
-->
<script lang="ts">
	import { cn } from "$lib/utils";
	import { CloudUpload } from "@lucide/svelte";
</script>

<div class="fixed top-4 right-4 z-50 sm:top-6 sm:right-6 lg:right-[var(--content-x)]">
	<a
		href="/login"
		class={cn(
			"sleek border-hair bg-card text-foreground group flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium backdrop-blur-sm",
			"ease-[var(--ease)] transition-colors active:scale-95 motion-reduce:transition-none",
			"hover:border-signal/50 focus-visible:outline-signal focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
		)}
	>
		<CloudUpload class="text-ink-muted group-hover:text-signal h-4 w-4 transition-colors" aria-hidden="true" />
		<span class="hidden sm:inline">Sign in to sync</span>
		<span class="sm:hidden">Sign in</span>
	</a>
</div>
