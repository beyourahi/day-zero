/**
 * Per-user monthly USD spend cap for AI Copilot, backed by AI_QUOTA_KV.
 * INVARIANT: when KV is absent the cap is DISABLED (checkSpendCap always allows,
 * recordSpend no-ops). Cost is an ESTIMATE derived from token counts and the
 * hardcoded per-token rates below — it is not the provider's billed amount.
 * Keys are scoped by UTC calendar month.
 */
const MONTH_SECONDS = 31 * 86400;
const DEFAULT_MONTHLY_CAP_USD = 1.0;

const USD_PER_INPUT_TOKEN = 0.35 / 1_000_000;
const USD_PER_OUTPUT_TOKEN = 0.75 / 1_000_000;

const monthKey = (userId: string): string => {
	const now = new Date();
	const yyyy = now.getUTCFullYear();
	const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
	return `ai:spend:${userId}:${yyyy}-${mm}`;
};

/** Falls back to DEFAULT_MONTHLY_CAP_USD for unset, non-numeric, zero, or negative input. */
const resolveCap = (raw: string | undefined): number => {
	const parsed = raw ? Number(raw) : NaN;
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MONTHLY_CAP_USD;
};

export const estimateTurnCostUsd = (inputTokens: number, outputTokens: number): number =>
	inputTokens * USD_PER_INPUT_TOKEN + outputTokens * USD_PER_OUTPUT_TOKEN;

export interface SpendCheck {
	allowed: boolean;
	spentUsd: number;
	capUsd: number;
}

/**
 * Read-only pre-flight check. @param capRaw raw AI_MONTHLY_CAP_USD var (parsed via resolveCap).
 * @returns allowed=false once accumulated spend reaches the cap. No KV write.
 */
export const checkSpendCap = async (
	kv: KVNamespace | undefined,
	userId: string,
	capRaw: string | undefined
): Promise<SpendCheck> => {
	const capUsd = resolveCap(capRaw);
	if (!kv) return { allowed: true, spentUsd: 0, capUsd };
	const stored = await kv.get(monthKey(userId));
	const spentUsd = stored ? Number(stored) : 0;
	return { allowed: spentUsd < capUsd, spentUsd, capUsd };
};

/**
 * SIDE EFFECT: read-add-write of the month's running USD total to KV (31-day TTL).
 * Non-transactional — concurrent turns may lose increments to a last-write-wins race.
 * Stored with 6-decimal precision.
 */
export const recordSpend = async (
	kv: KVNamespace | undefined,
	userId: string,
	inputTokens: number,
	outputTokens: number
): Promise<void> => {
	if (!kv) return;
	const key = monthKey(userId);
	const stored = await kv.get(key);
	const next = (stored ? Number(stored) : 0) + estimateTurnCostUsd(inputTokens, outputTokens);
	await kv.put(key, next.toFixed(6), { expirationTtl: MONTH_SECONDS });
};
