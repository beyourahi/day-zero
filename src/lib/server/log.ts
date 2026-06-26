/**
 * Structured stdout logging for AI Copilot turns and tool executions (one JSON line per event,
 * consumed by Workers log tail). PRIVACY: user IDs are never logged raw — only hashUser's
 * truncated SHA-256 prefix appears as user_hash.
 */

/** First 8 bytes (16 hex chars) of SHA-256(userId) — a non-reversible, collision-tolerant tag
 * for correlating a user's events without storing their identity. */
const hashUser = async (userId: string): Promise<string> => {
	const data = new TextEncoder().encode(userId);
	const digest = await crypto.subtle.digest("SHA-256", data);
	const bytes = new Uint8Array(digest);
	let hex = "";
	for (let i = 0; i < 8; i++) {
		hex += bytes[i].toString(16).padStart(2, "0");
	}
	return hex;
};

export interface ChatTurnLog {
	userId: string;
	conversationId: string;
	turnId: string;
	inputTokens: number;
	outputTokens: number;
	toolCallCount: number;
	toolCallSuccessCount: number;
	latencyMs: number;
	promptVersion: string;
	retried: boolean;
	error?: string;
}

export interface ToolExecutionLog {
	userId: string;
	conversationId: string | null;
	toolName: string;
	safetyTier: "A" | "B";
	requiredConfirmation: boolean;
	applied: boolean;
	inverseValidated: boolean;
	error?: string;
}

export const logChatTurn = async (entry: ChatTurnLog) => {
	const hashed = await hashUser(entry.userId);
	console.log(
		JSON.stringify({
			event: "ai.chat_turn",
			user_hash: hashed,
			conversation_id: entry.conversationId,
			turn_id: entry.turnId,
			input_tokens: entry.inputTokens,
			output_tokens: entry.outputTokens,
			tool_call_count: entry.toolCallCount,
			tool_call_success_count: entry.toolCallSuccessCount,
			latency_ms: entry.latencyMs,
			prompt_version: entry.promptVersion,
			retried: entry.retried,
			error: entry.error ?? null
		})
	);
};

export const logToolExecution = async (entry: ToolExecutionLog) => {
	const hashed = await hashUser(entry.userId);
	console.log(
		JSON.stringify({
			event: "ai.tool_execution",
			user_hash: hashed,
			conversation_id: entry.conversationId,
			tool_name: entry.toolName,
			safety_tier: entry.safetyTier,
			required_confirmation: entry.requiredConfirmation,
			applied: entry.applied,
			inverse_validated: entry.inverseValidated,
			error: entry.error ?? null
		})
	);
};
