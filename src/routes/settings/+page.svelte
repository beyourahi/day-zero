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
	import { ArrowLeft, RefreshCw, Fingerprint, Trash2 } from "@lucide/svelte";
	import { authClient } from "$lib/auth-client";
	import { Eyebrow, Heading, Cta, cn, inputBase, labelBase } from "$lib/ds";

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

<main class="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 pt-10 pb-20 sm:px-6 sm:pt-14">
	<header class="flex flex-col gap-4">
		<a
			href="/"
			class="text-ink-muted hover:text-foreground focus-visible:outline-signal inline-flex w-fit items-center gap-2 font-mono text-caption tracking-[0.18em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
		>
			<ArrowLeft size={13} aria-hidden="true" />
			Back to board
		</a>
		<div class="flex flex-col gap-2.5">
			<Eyebrow>Settings</Eyebrow>
			<Heading as="h1" size="title-lg">Cloudflare account</Heading>
			<p class="text-ink-muted max-w-xl text-sm leading-relaxed text-pretty">
				The copilot runs on <span class="text-foreground">your own</span>
				Cloudflare account, so any usage is billed to you, not us. Connecting your account is
				<span class="text-foreground">required</span> to use the copilot.
			</p>
		</div>
	</header>

	<section class="border-hair bg-card flex flex-col overflow-hidden rounded-2xl border">
		<div class="border-hair flex items-center justify-between gap-3 border-b px-5 py-3.5 sm:px-6">
			<Eyebrow as="h2">Connection</Eyebrow>
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
		</div>

		<form
			method="POST"
			action="?/save"
			class="flex flex-col gap-6 px-5 py-6 sm:px-6"
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
			<div class="flex flex-col">
				<label class={labelBase} for="cf-token">API token</label>
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
				<p class="text-ink-muted mt-2 text-xs leading-relaxed text-pretty">
					{#if connected}
						Stored: <span class="text-foreground font-mono">{maskedToken}</span> — leave blank to keep it.
					{:else}
						An API token with the <span class="text-foreground">Account · Workers AI · Read</span>
						permission. Stored securely. You won't see it again after saving.
					{/if}
				</p>
			</div>

			<div class="flex flex-col">
				<label class={labelBase} for="cf-account">Account ID</label>
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
				<p class="text-ink-muted mt-2 text-xs leading-relaxed text-pretty">
					Found in the right sidebar of any account page in the Cloudflare dashboard.
				</p>
			</div>

			<div class="flex flex-col">
				<div class="mb-2.5 flex items-center justify-between gap-3">
					<label class={cn(labelBase, "mb-0")} for="cf-model">Model</label>
					<button
						type="button"
						onclick={refreshModels}
						disabled={refreshing || !connected}
						title="Refresh model list"
						class="text-ink-muted hover:text-foreground focus-visible:outline-signal inline-flex items-center gap-1.5 font-mono text-micro tracking-[0.14em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
					>
						<RefreshCw size={11} class={refreshing ? "animate-spin" : ""} aria-hidden="true" />
						Refresh
					</button>
				</div>
				<select
					id="cf-model"
					name="cloudflareModel"
					bind:value={model}
					class={cn(inputBase, "appearance-none")}
				>
					{#each modelOptions as opt (opt.id)}
						<option value={opt.id}>{opt.label}</option>
					{/each}
				</select>
				<p class="text-ink-muted mt-2 text-xs leading-relaxed text-pretty">
					Llama 3.3 70B is recommended. Others are experimental and may be less reliable.
				</p>
			</div>

			<div class="border-hair flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
				<p class="text-ink-muted max-w-sm text-xs leading-relaxed text-pretty">
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
				<Cta type="submit" variant="primary" arrow={false} disabled={saving} class="justify-center">
					{saving ? "Saving…" : "Save"}
				</Cta>
			</div>
		</form>
	</section>

	<section class="border-hair bg-card flex flex-col overflow-hidden rounded-2xl border">
		<div class="border-hair flex items-center justify-between gap-3 border-b px-5 py-3.5 sm:px-6">
			<Eyebrow as="h2">Face ID / Touch ID</Eyebrow>
		</div>

		<div class="flex flex-col gap-5 px-5 py-6 sm:px-6">
			<p class="text-ink-muted max-w-xl text-sm leading-relaxed text-pretty">
				Set up <span class="text-foreground">Face ID or Touch ID</span> to sign in without Google. It's stored on
				this device.
			</p>

			{#if !webauthnAvailable}
				<p class="text-ink-muted text-xs leading-relaxed text-pretty">
					This browser can't use Face ID / Touch ID. Open the app in Safari, Chrome, or Edge on a device with
					Face ID, Touch ID, or a fingerprint sensor.
				</p>
			{:else}
				{#if passkeysLoading}
					<div class="text-ink-muted flex items-center gap-2 text-xs">
						<span
							class="border-ink-muted/40 size-3.5 animate-spin rounded-full border-2 border-t-transparent"
							aria-hidden="true"
						></span>
						Loading…
					</div>
				{:else if passkeys.length === 0}
					<p class="text-ink-muted text-xs leading-relaxed text-pretty">
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
										<p class="text-foreground truncate text-sm font-medium">
											{pk.name || "Face ID / Touch ID"}
										</p>
										{#if pk.createdAt && formatDate(pk.createdAt)}
											<p class="text-ink-muted text-caption">Added {formatDate(pk.createdAt)}</p>
										{/if}
									</div>
								</div>
								<button
									type="button"
									onclick={() => removePasskey(pk.id)}
									disabled={passkeyBusy}
									aria-label="Remove Face ID / Touch ID"
									class="text-ink-muted hover:text-destructive focus-visible:outline-signal shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
								>
									<Trash2 size={14} aria-hidden="true" />
								</button>
							</li>
						{/each}
					</ul>
				{/if}

				<div class="flex flex-wrap items-center gap-2.5">
					<Cta
						variant="primary"
						arrow={false}
						disabled={passkeyBusy}
						onclick={() => addPasskey()}
						class="justify-center"
					>
						<span class="inline-flex items-center gap-2">
							<Fingerprint size={14} aria-hidden="true" />
							Set up Face ID / Touch ID
						</span>
					</Cta>
				</div>
			{/if}
		</div>
	</section>
</main>
