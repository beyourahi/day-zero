<!--
	Top-right signed-in avatar with sign-out. Mobile (<sm): tap opens a Dialog. Desktop (sm+):
	hover expands a name/email pill beside a dedicated sign-out button. The fixed offset shifts
	left at lg+ to clear the AI Copilot rail.
-->
<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { goto } from "$app/navigation";
	import { cn } from "$lib/utils";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import { Eyebrow } from "$lib/ds";
	import { LogOut } from "@lucide/svelte";
	import type { CurrentUser } from "$lib/types";

	interface Props {
		user: {
			email: string;
			name: string;
			image?: string | null | undefined;
		};
		currentUser: CurrentUser;
	}

	let { user, currentUser }: Props = $props();

	let isLoggingOut = $state(false);
	let expanded = $state(false);
	let mobileOpen = $state(false);

	const handleLogout = async () => {
		isLoggingOut = true;
		try {
			await authClient.signOut();
			mobileOpen = false;
			goto("/login");
		} finally {
			isLoggingOut = false;
		}
	};
</script>

{#snippet avatarVisual(sizeClass: string, iconClass: string)}
	<div
		class={cn(
			"sleek relative flex shrink-0 items-center justify-center rounded-full text-sm font-semibold",
			"border-hair bg-card text-foreground border backdrop-blur-sm",
			sizeClass,
			user.image && "overflow-hidden p-0"
		)}
	>
		{#if user.image}
			<img src={user.image} alt={user.name} class="h-full w-full object-cover" referrerpolicy="no-referrer" />
		{:else}
			<svg
				class={iconClass}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
		{/if}
	</div>
{/snippet}

<div class="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
	<div class="sm:hidden">
		<Dialog.Root bind:open={mobileOpen}>
			<Dialog.Trigger
				aria-label="User menu"
				class="focus-visible:outline-signal rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				{@render avatarVisual("h-9 w-9", "h-4 w-4")}
			</Dialog.Trigger>
			<Dialog.Content
				class="data-open:slide-in-from-bottom-2 data-closed:slide-out-to-bottom-1 gap-0 p-0 sm:max-w-sm"
				showCloseButton={false}
			>
				<Dialog.Header class="border-hair border-b px-4 py-3.5">
					<Dialog.Title>
						<Eyebrow as="span">Signed in</Eyebrow>
					</Dialog.Title>
				</Dialog.Header>
				<div class="flex items-center gap-3 px-4 py-4">
					{@render avatarVisual("h-12 w-12", "h-6 w-6")}
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{currentUser.name}</p>
						<p class="text-ink-muted truncate text-xs">{user.email}</p>
					</div>
				</div>
				<div class="border-hair border-t p-1.5">
					<button
						type="button"
						onclick={handleLogout}
						disabled={isLoggingOut}
						class={cn(
							"text-destructive pointer-fine:hover:bg-destructive/10 pointer-fine:hover:text-destructive focus:bg-destructive/10 focus:text-destructive flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
							isLoggingOut && "cursor-wait"
						)}
					>
						{#if isLoggingOut}
							<div
								class="border-ink-muted h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
								aria-hidden="true"
							></div>
						{:else}
							<LogOut size={16} aria-hidden="true" />
						{/if}
						<span class="text-sm font-medium whitespace-nowrap">Sign out</span>
					</button>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="hidden items-center gap-2 sm:flex">
		<div
			class="group relative flex items-center"
			role="group"
			aria-label="User profile"
			onmouseenter={() => (expanded = true)}
			onmouseleave={() => (expanded = false)}
		>
			<div class="relative z-10">
				{@render avatarVisual("h-10 w-10", "h-5 w-5")}
			</div>

			<div
				class={cn(
					"border-hair bg-card sleek absolute right-0 flex h-10 items-center overflow-hidden rounded-full border whitespace-nowrap backdrop-blur-sm",
					expanded ? "w-auto pr-12 pl-3 opacity-100" : "w-0 pr-0 pl-0 opacity-0"
				)}
			>
				<div class="flex flex-col justify-center">
					<span class="text-foreground text-sm leading-tight font-medium whitespace-nowrap">
						{currentUser.name}
					</span>
					<span class="text-ink-muted text-xs leading-tight whitespace-nowrap">{user.email}</span>
				</div>
			</div>
		</div>

		<Tooltip.Provider delayDuration={150}>
			<Tooltip.Root>
				<Tooltip.Trigger
					onclick={handleLogout}
					disabled={isLoggingOut}
					aria-label="Sign out"
					class={cn(
						"sleek group flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border backdrop-blur-sm",
						"focus-visible:outline-signal focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2",
						isLoggingOut
							? "border-hair bg-card cursor-wait"
							: "border-hair bg-card pointer-fine:hover:border-destructive/50 pointer-fine:hover:bg-destructive/10 active:scale-95"
					)}
				>
					{#if isLoggingOut}
						<div
							class="border-ink-muted h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
							aria-hidden="true"
						></div>
					{:else}
						<svg
							class="text-ink-muted pointer-fine:group-hover:text-destructive h-[1.125rem] w-[1.125rem] transition-colors"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
							<line x1="12" y1="2" x2="12" y2="12" />
						</svg>
					{/if}
				</Tooltip.Trigger>
				{#if !isLoggingOut}
					<Tooltip.Content side="bottom">Sign out</Tooltip.Content>
				{/if}
			</Tooltip.Root>
		</Tooltip.Provider>
	</div>
</div>
