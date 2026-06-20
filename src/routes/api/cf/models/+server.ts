import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { getDatabase } from "$lib/server/db";
import { loadCloudflareConfig, resolveCloudflareCreds } from "$lib/server/ai/cloudflare-config";
import { listChatModels, type CfModel } from "$lib/server/ai/run-rest";
import { describeCloudflareError } from "$lib/server/ai/errors";

/**
 * GET /api/cf/models — the function-calling chat models on the user's connected
 * Cloudflare account, for the settings model picker. Cached per account (24h) in
 * AI_QUOTA_KV when present; `?refresh=1` forces a live re-fetch. Never returns the
 * owner's models — always the authenticated user's own account.
 */
export const GET: RequestHandler = async ({ locals, platform, url }) => {
	const userId = locals.user?.id;
	if (!userId || !platform?.env?.DB) throw error(503, "platform unavailable");

	const db = getDatabase(platform.env.DB);
	const cfg = await loadCloudflareConfig(db, userId);
	if (!cfg.accountId) {
		return json({ models: [] as CfModel[], connected: false });
	}

	const kv = platform.env.AI_QUOTA_KV;
	const cacheKey = `cf-models:${cfg.accountId}`;
	const refresh = url.searchParams.get("refresh") === "1";

	if (!refresh && kv) {
		const cached = await kv.get<{ models?: CfModel[] }>(cacheKey, "json");
		if (cached && Array.isArray(cached.models)) {
			return json({ models: cached.models, connected: true, cached: true });
		}
	}

	const key = platform.env.TOKEN_ENCRYPTION_KEY;
	if (!key) {
		return json({
			models: [] as CfModel[],
			connected: true,
			error: "encryption key not configured"
		});
	}

	const resolved = await resolveCloudflareCreds(key, cfg).catch(() => null);
	if (!resolved) {
		return json({ models: [] as CfModel[], connected: false });
	}

	try {
		const models = await listChatModels(resolved.creds);
		await kv?.put(cacheKey, JSON.stringify({ models, cachedAt: Date.now() }), {
			expirationTtl: 86400
		});
		return json({ models, connected: true, cached: false });
	} catch (e) {
		return json({ models: [] as CfModel[], connected: true, error: describeCloudflareError(e) });
	}
};
