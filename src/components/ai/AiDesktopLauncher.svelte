<!--
	Desktop-only (lg+) floating launcher that opens the Copilot rail — the twin of AiMobileFab.
	Hidden while the rail is already open. Mobile (<lg) uses AiMobileFab + AiMobileSheet instead, so
	the two launchers never appear together.
-->
<script lang="ts">
	import { ai } from "$lib/stores/ai.svelte";
	import AiLauncherIcon from "./AiLauncherIcon.svelte";

	const hidden = $derived(ai.desktopOpen);
</script>

{#if !hidden}
	<div class="fixed right-5 bottom-5 z-40 hidden lg:block">
		<span class="chat-btn-ripple-ring" style="animation-delay: 0s" aria-hidden="true"></span>
		<span class="chat-btn-ripple-ring" style="animation-delay: 1.5s" aria-hidden="true"></span>
		<button
			type="button"
			onclick={() => ai.openDesktop()}
			class="group border-chat-border bg-chat-surface hover:border-chat-text-muted hover:bg-chat-surface-hover relative z-10 flex size-14 items-center justify-center rounded-full border border-solid shadow-[var(--chat-shadow)] transition-all duration-300 ease-out active:scale-95"
			aria-label="Open AI chat"
		>
			<AiLauncherIcon variant="grid" class="size-6" />
		</button>
	</div>
{/if}
