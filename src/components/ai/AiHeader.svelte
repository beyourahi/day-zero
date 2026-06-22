<!--
	Copilot toolbar: connection-status dot, history toggle, new-conversation, and (mobile sheet
	only) close. New-conversation only appears once there are messages; close only when bare+onClose.
-->
<script lang="ts">
	import { X, Plus, Clock } from "@lucide/svelte";

	let {
		onClose,
		onNewConversation,
		onToggleHistory,
		hasMessages,
		historyOpen,
		historyCount,
		status = "online",
		showCloseButton = false
	}: {
		onClose?: () => void;
		onNewConversation: () => void;
		onToggleHistory: () => void;
		hasMessages: boolean;
		historyOpen: boolean;
		historyCount: number;
		status?: "online" | "connecting" | "error";
		showCloseButton?: boolean;
	} = $props();

	const statusConfig = $derived(
		{
			online: { dot: "bg-status-ok", label: "online" },
			connecting: { dot: "bg-status-warn animate-pulse", label: "connecting" },
			error: { dot: "bg-status-error", label: "offline" }
		}[status]
	);
</script>

<div class="border-chat-border flex items-center justify-between border-b border-solid px-4 py-3 md:px-5 md:py-4">
	<div class="flex items-center gap-2.5">
		<div class="size-1.5 rounded-full {statusConfig.dot}"></div>
		<span class="text-chat-text-muted font-mono text-micro tracking-[0.22em] whitespace-nowrap uppercase">
			{statusConfig.label}
		</span>
	</div>
	<div class="flex items-center gap-1">
		<button
			type="button"
			onclick={onToggleHistory}
			aria-expanded={historyOpen}
			class="hover:bg-chat-surface-hover relative touch-manipulation rounded-xl p-2.5 transition-colors md:p-2"
			aria-label="Chat history"
		>
			<Clock class="text-chat-icon-muted h-5 w-5 md:h-4 md:w-4" />
			{#if historyCount > 0}
				<span
					class="bg-chat-accent text-chat-bg absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 font-mono text-micro font-semibold tabular-nums"
				>
					{historyCount}
				</span>
			{/if}
		</button>
		{#if hasMessages}
			<button
				type="button"
				onclick={onNewConversation}
				class="hover:bg-chat-surface-hover touch-manipulation rounded-xl p-2.5 transition-colors md:p-2"
				aria-label="New conversation"
			>
				<Plus class="text-chat-icon-muted h-5 w-5 md:h-4 md:w-4" />
			</button>
		{/if}
		{#if showCloseButton && onClose}
			<button
				type="button"
				onclick={onClose}
				class="hover:bg-chat-surface-hover touch-manipulation rounded-xl p-2.5 transition-colors md:p-2"
				aria-label="Close chat"
			>
				<X class="text-chat-icon-muted h-5 w-5 md:h-4 md:w-4" />
			</button>
		{/if}
	</div>
</div>
