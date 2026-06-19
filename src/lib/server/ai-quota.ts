/**
 * Per-user daily AI Copilot turn limit, backed by AI_QUOTA_KV.
 * INVARIANT: when the KV binding is absent the quota is DISABLED — every call
 * returns allowed=true with count=0, so a missing binding silently uncaps usage.
 * Keys are scoped by UTC calendar day; the day boundary is UTC midnight, not local.
 */
export interface QuotaResult {
	allowed: boolean;
	count: number;
	limit: number;
	resetsAt: string;
}

const DEFAULT_DAILY_LIMIT = 200;
const DAY_SECONDS = 86400;

const todayKey = (userId: string, now: Date): string => {
	const yyyy = now.getUTCFullYear();
	const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
	const dd = String(now.getUTCDate()).padStart(2, "0");
	return `ai:quota:${userId}:${yyyy}-${mm}-${dd}`;
};

const nextUtcMidnight = (now: Date): Date => {
	const next = new Date(now);
	next.setUTCDate(next.getUTCDate() + 1);
	next.setUTCHours(0, 0, 0, 0);
	return next;
};

/**
 * Atomically-ish read-then-increment the day counter. SIDE EFFECT: writes KV
 * (24h TTL) only when the turn is allowed; a rejected turn does not consume budget.
 * NOTE: not transactional — concurrent turns can race past the limit by a small margin.
 * @returns allowed=false when count is already at/over limit (no write performed).
 */
export const checkAndIncrementQuota = async (
	kv: KVNamespace | undefined,
	userId: string,
	limit: number = DEFAULT_DAILY_LIMIT
): Promise<QuotaResult> => {
	const now = new Date();
	const resetsAt = nextUtcMidnight(now).toISOString();

	if (!kv) {
		return { allowed: true, count: 0, limit, resetsAt };
	}

	const key = todayKey(userId, now);
	const raw = await kv.get(key);
	const current = raw ? parseInt(raw, 10) || 0 : 0;
	if (current >= limit) {
		return { allowed: false, count: current, limit, resetsAt };
	}

	const next = current + 1;
	await kv.put(key, String(next), { expirationTtl: DAY_SECONDS });
	return { allowed: true, count: next, limit, resetsAt };
};

/** Read-only quota probe — no increment, no KV write. Same disabled-when-no-KV contract. */
export const getQuotaUsage = async (
	kv: KVNamespace | undefined,
	userId: string,
	limit: number = DEFAULT_DAILY_LIMIT
): Promise<QuotaResult> => {
	const now = new Date();
	const resetsAt = nextUtcMidnight(now).toISOString();
	if (!kv) return { allowed: true, count: 0, limit, resetsAt };
	const key = todayKey(userId, now);
	const raw = await kv.get(key);
	const current = raw ? parseInt(raw, 10) || 0 : 0;
	return { allowed: current < limit, count: current, limit, resetsAt };
};
