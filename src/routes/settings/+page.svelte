<!--
	Settings — connect your own Cloudflare account so the AI copilot runs (and bills)
	on it. Built from the vendored @dropout/ds: Eyebrow/Heading editorial labels, hairline
	surfaces, the inputBase/labelBase form vocabulary, and the one Cta language. Dark-only.
	The API token is write-once-and-masked: the server returns only maskToken(plain), never
	the raw secret. The model picker is hydrated from the account's cached chat models; the
	Refresh control re-fetches live via /api/cf/models?refresh=1.
-->
<script lang="ts">
	import { untrack, onMount } from "svelte";
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { browser } from "$app/environment";
	import { toast } from "svelte-sonner";
	import { ArrowLeft, RefreshCw, Fingerprint, Trash2, Plug, ScanFace } from "@lucide/svelte";
	import { authClient } from "$lib/auth-client";
	import {
		Eyebrow,
		Heading,
		Cta,
		cn,
		inputBase,
		bodyBase,
		helperBase,
		metaBase,
		SettingsSection,
		SettingsRow
	} from "$lib/ds";
	import * as Select from "$lib/components/ui/select";

	let { data } = $props();

	const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

	const connected = $derived(data.connected);
	const maskedToken = $derived(data.maskedToken ?? "");

	// Controlled fields, seeded ONCE from the server load (untrack so the seed read
	// isn't treated as reactive). Token starts empty (write-only); leaving it blank on
	// save preserves the stored secret.
	let token = $state("");
	let accountId = $state(untrack(() => data.accountId ?? ""));
	let model = $state(untrack(() => data.model ?? DEFAULT_MODEL));
	let saving = $state(false);

	// Picker options from the account's cached chat models. Always surfaces the recommended
	// default first, plus the currently-selected id, even if the live list omits it.
	const modelOptions = $derived.by(() => {
		const list = data.models ?? [];
		const ids = new Set(list.map(m => m.id));
		const opts = list.map(m => ({
			id: m.id,
			label:
				m.id === DEFAULT_MODEL
					? `${m.label} · recommended`
					: `${m.label} · experimental${m.deprecated ? " (deprecated)" : ""}`
		}));
		if (!ids.has(DEFAULT_MODEL)) {
			opts.unshift({ id: DEFAULT_MODEL, label: "meta/llama-3.3-70b-instruct-fp8-fast · recommended" });
		}
		if (model && model !== DEFAULT_MODEL && !ids.has(model)) {
			opts.push({ id: model, label: `${model.replace(/^@cf\//, "").replace(/^@hf\//, "")} · experimental` });
		}
		return opts;
	});

	// Label shown in the closed trigger for the currently-bound model.
	const selectedModelLabel = $derived(modelOptions.find(opt => opt.id === model)?.label ?? "Select a model");

	let refreshing = $state(false);
	const refreshModels = async () => {
		refreshing = true;
		try {
			await fetch("/api/cf/models?refresh=1");
			await invalidateAll();
		} finally {
			refreshing = false;
		}
	};

	// ── Passkeys (WebAuthn = device biometrics: Face ID / Touch ID / fingerprint) ──────────
	type PasskeyRow = { id: string; name?: string | null; createdAt?: string | Date | null };
	let passkeys = $state<PasskeyRow[]>([]);
	let passkeysLoading = $state(true);
	let passkeyBusy = $state(false);
	let webauthnAvailable = $state(false);

	// Friendly default name from the UA — stored as the passkey label.
	const deviceLabel = () => {
		const ua = browser ? navigator.userAgent : "";
		if (/iPhone|iPad|iPod/.test(ua)) return "iPhone (Face ID / Touch ID)";
		if (/Macintosh/.test(ua)) return "Mac (Touch ID)";
		if (/Android/.test(ua)) return "Android (fingerprint / face)";
		if (/Windows/.test(ua)) return "Windows Hello";
		return "This device";
	};

	const formatDate = (d: string | Date) => {
		const date = typeof d === "string" ? new Date(d) : d;
		return Number.isNaN(date.getTime())
			? ""
			: date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
	};

	const loadPasskeys = async () => {
		passkeysLoading = true;
		try {
			const res = await authClient.passkey.listUserPasskeys();
			passkeys = (res?.data ?? []) as PasskeyRow[];
		} catch {
			passkeys = [];
		} finally {
			passkeysLoading = false;
		}
	};

	onMount(() => {
		webauthnAvailable = typeof window !== "undefined" && !!window.PublicKeyCredential;
		if (webauthnAvailable) loadPasskeys();
		else passkeysLoading = false;
	});

	// Always registers a platform biometric (Face ID / Touch ID / fingerprint);
	// roaming security keys are not offered.
	const addPasskey = async () => {
		passkeyBusy = true;
		try {
			const res = await authClient.passkey.addPasskey({
				name: deviceLabel(),
				authenticatorAttachment: "platform"
			});
			if (res?.error) toast.error(res.error.message || "Couldn't set up Face ID / Touch ID.");
			else {
				toast.success("Face ID / Touch ID is ready.");
				await loadPasskeys();
			}
		} catch {
			toast.error("Setup was cancelled.");
		} finally {
			passkeyBusy = false;
		}
	};

	const removePasskey = async (id: string) => {
		if (!confirm("Remove Face ID / Touch ID? You won't be able to sign in with it on this device anymore.")) return;
		passkeyBusy = true;
		try {
			const res = await authClient.passkey.deletePasskey({ id });
			if (res?.error) toast.error(res.error.message || "Couldn't remove Face ID / Touch ID.");
			else {
				toast.success("Face ID / Touch ID removed.");
				await loadPasskeys();
			}
		} catch {
			toast.error("Couldn't remove Face ID / Touch ID.");
		} finally {
			passkeyBusy = false;
		}
	};
</script>

<svelte:head>
	<title>Settings · Day Zero</title>
</svelte:head>

<main
	id="main"
	tabindex="-1"
	class="mx-auto flex w-full max-w-[var(--settings-max)] grow flex-col gap-10 px-[var(--content-x)] py-10 outline-none sm:py-14"
>
	<header class="flex flex-col gap-4">
		<a
			href="/"
			class={cn(
				helperBase,
				"hover:text-foreground focus-visible:outline-signal inline-flex w-fit items-center gap-2 font-mono tracking-[0.18em] whitespace-nowrap uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 touch-manipulation"
			)}
		>
			<ArrowLeft size={13} aria-hidden="true" />
			Back to board
		</a>
		<div class="flex flex-col gap-2.5">
			<Eyebrow>Settings</Eyebrow>
			<Heading as="h1" size="title-lg" weight={600}>Cloudflare account</Heading>
			<p class={cn(bodyBase, "max-w-prose")}>
				The copilot runs on <span class="text-foreground">your own</span>
				Cloudflare account, so any usage is billed to you, not us. Connecting your account is
				<span class="text-foreground">required</span> to use the copilot.
			</p>
		</div>
	</header>

	<SettingsSection
		title="Connection"
		subtitle="Your Cloudflare credentials power the copilot."
		icon={Plug}
	>
		{#snippet header()}
			<span
				class={cn(
					"inline-flex items-center gap-2 font-mono text-caption tracking-[0.14em] uppercase",
					connected ? "text-foreground" : "text-ink-muted"
				)}
			>
				<span
					class={cn("size-1.5 rounded-full", connected ? "bg-signal" : "bg-ink-muted/50")}
					aria-hidden="true"
				></span>
				{connected ? "Connected" : "Not connected"}
			</span>
		{/snippet}

		<form
			method="POST"
			action="?/save"
			class="flex flex-col gap-6"
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					saving = false;
					if (result.type === "success") {
						token = "";
						toast.success("Settings saved");
					} else if (result.type === "failure") {
						toast.error((result.data?.error as string | undefined) ?? "Couldn't save settings");
					}
					await update({ reset: false });
				};
			}}
		>
			<SettingsRow label="API token" htmlFor="cf-token" stacked>
				<input
					id="cf-token"
					name="cloudflareToken"
					type="password"
					bind:value={token}
					placeholder={maskedToken || "v1.0-…"}
					autocomplete="off"
					spellcheck="false"
					class={inputBase}
				/>
				<p class={cn(helperBase, "mt-2")}>
					{#if connected}
						Stored: <span class="text-foreground font-mono wrap-break-word">{maskedToken}</span> — leave blank
						to keep it.
					{:else}
						An API token with the <span class="text-foreground">Account · Workers AI · Read</span>
						permission. Stored securely. You won't see it again after saving.
					{/if}
				</p>
			</SettingsRow>

			<SettingsRow label="Account ID" htmlFor="cf-account" stacked>
				<input
					id="cf-account"
					name="cloudflareAccountId"
					type="text"
					bind:value={accountId}
					placeholder="0123456789abcdef…"
					autocomplete="off"
					spellcheck="false"
					class={inputBase}
				/>
				<p class={cn(helperBase, "mt-2")}>
					Found in the right sidebar of any account page in the Cloudflare dashboard.
				</p>
			</SettingsRow>

			<SettingsRow label="Model" htmlFor="cf-model" stacked>
				<div class="mb-2.5 flex items-center justify-end">
					<button
						type="button"
						onclick={refreshModels}
						disabled={refreshing || !connected}
						title="Refresh model list"
						class="text-ink-muted hover:text-foreground focus-visible:outline-signal inline-flex items-center gap-1.5 font-mono text-micro tracking-[0.14em] whitespace-nowrap uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 touch-manipulation"
					>
						<RefreshCw size={11} class={refreshing ? "animate-spin" : ""} aria-hidden="true" />
						Refresh
					</button>
				</div>
				<Select.Root type="single" name="cloudflareModel" bind:value={model}>
					<Select.Trigger
						id="cf-model"
						class={cn(inputBase, "h-auto w-full justify-between text-left font-mono")}
					>
						<span data-slot="select-value" class="truncate">{selectedModelLabel}</span>
					</Select.Trigger>
					<Select.Content
						class="border-hair bg-card max-h-72 rounded-[11px] font-mono shadow-lg ring-0"
						sideOffset={6}
					>
						{#each modelOptions as opt (opt.id)}
							<Select.Item
								value={opt.id}
								label={opt.label}
								class="hover:bg-ink-2 data-highlighted:bg-ink-2 rounded-md text-xs"
							/>
						{/each}
					</Select.Content>
				</Select.Root>
				<p class={cn(helperBase, "mt-2")}>
					Llama 3.3 70B is recommended. Others are experimental and may be less reliable.
				</p>
			</SettingsRow>

			<div class="border-hair flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
				<p class={cn(helperBase, "max-w-prose")}>
					Create a token at
					<a
						href="https://dash.cloudflare.com/profile/api-tokens"
						target="_blank"
						rel="noreferrer"
						class="text-foreground decoration-hair underline underline-offset-2 hover:decoration-current"
					>
						dash.cloudflare.com/profile/api-tokens
					</a>
					→ Create Custom Token → permission
					<span class="text-foreground font-mono">Account · Workers AI · Read</span>.
				</p>
				<Cta
					type="submit"
					variant="primary"
					arrow={false}
					disabled={saving}
					class="justify-center touch-manipulation"
				>
					{saving ? "Saving…" : "Save"}
				</Cta>
			</div>
		</form>
	</SettingsSection>

	<SettingsSection
		title="Face ID / Touch ID"
		subtitle="Sign in with device biometrics instead of Google."
		icon={ScanFace}
	>
		<p class={cn(bodyBase, "max-w-prose")}>
			Set up <span class="text-foreground">Face ID or Touch ID</span> to sign in without Google. It's stored on
			this device.
		</p>

		{#if !webauthnAvailable}
			<p class={cn(helperBase, "max-w-prose")}>
				This browser can't use Face ID / Touch ID. Open the app in Safari, Chrome, or Edge on a device with
				Face ID, Touch ID, or a fingerprint sensor.
			</p>
		{:else}
			{#if passkeysLoading}
				<div class={cn(helperBase, "flex items-center gap-2")}>
					<span
						class="border-ink-muted/40 size-3.5 animate-spin rounded-full border-2 border-t-transparent"
						aria-hidden="true"
					></span>
					Loading…
				</div>
			{:else if passkeys.length === 0}
				<p class={cn(helperBase, "max-w-prose")}>
					Not set up yet. Add Face ID / Touch ID below to sign in without Google.
				</p>
			{:else}
				<ul class="flex flex-col gap-2">
					{#each passkeys as pk (pk.id)}
						<li
							class="border-hair bg-background/40 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3"
						>
							<div class="flex min-w-0 items-center gap-2.5">
								<Fingerprint size={15} class="text-signal shrink-0" aria-hidden="true" />
								<div class="min-w-0">
									<p class="text-foreground truncate text-label font-medium">
										{pk.name || "Face ID / Touch ID"}
									</p>
									{#if pk.createdAt && formatDate(pk.createdAt)}
										<p class={metaBase}>
											Added {formatDate(pk.createdAt)}
										</p>
									{/if}
								</div>
							</div>
							<button
								type="button"
								onclick={() => removePasskey(pk.id)}
								disabled={passkeyBusy}
								aria-label="Remove Face ID / Touch ID"
								class="text-ink-muted hover:text-destructive focus-visible:outline-signal shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 touch-manipulation"
							>
								<Trash2 size={14} aria-hidden="true" />
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="border-hair flex items-center justify-end gap-3 border-t pt-5">
				<Cta
					variant="primary"
					arrow={false}
					disabled={passkeyBusy}
					onclick={() => addPasskey()}
					class="justify-center touch-manipulation"
				>
					<span class="inline-flex items-center gap-2">
						<Fingerprint size={14} aria-hidden="true" />
						Set up Face ID / Touch ID
					</span>
				</Cta>
			</div>
		{/if}
	</SettingsSection>
</main>
