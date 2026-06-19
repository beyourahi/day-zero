/**
 * D1 persistence for ai_messages (turns within a conversation), ordered by createdAt asc.
 * Scoped by conversationId, NOT userId — ownership is enforced one level up via the
 * conversation lookup. toolCalls/toolResults are JSON columns hydrated back to typed arrays.
 */
import { asc, eq } from "drizzle-orm";
import type { Database } from "../db";
import { aiMessages } from "../schema";

export type AiMessageRole = "user" | "assistant" | "tool" | "system";

export interface AiMessageToolCall {
	id: string;
	name: string;
	args: unknown;
}

export interface AiMessageToolResult {
	id: string;
	status: "applied" | "rejected" | "failed" | "pending_confirmation";
	error?: string;
	actionId?: string;
}

export interface AiMessageRow {
	id: string;
	conversationId: string;
	role: AiMessageRole;
	content: string;
	toolCalls: AiMessageToolCall[] | null;
	toolResults: AiMessageToolResult[] | null;
	inputTokens: number | null;
	outputTokens: number | null;
	createdAt: Date;
}

export interface AppendMessageInput {
	role: AiMessageRole;
	content: string;
	toolCalls?: AiMessageToolCall[] | null;
	toolResults?: AiMessageToolResult[] | null;
	inputTokens?: number | null;
	outputTokens?: number | null;
}

const toRow = (raw: typeof aiMessages.$inferSelect): AiMessageRow => ({
	id: raw.id,
	conversationId: raw.conversationId,
	role: raw.role,
	content: raw.content,
	toolCalls: (raw.toolCalls as AiMessageToolCall[] | null) ?? null,
	toolResults: (raw.toolResults as AiMessageToolResult[] | null) ?? null,
	inputTokens: raw.inputTokens,
	outputTokens: raw.outputTokens,
	createdAt: raw.createdAt
});

export const appendMessage = async (
	db: Database,
	conversationId: string,
	message: AppendMessageInput
): Promise<AiMessageRow> => {
	const id = crypto.randomUUID();
	const now = new Date();
	await db
		.insert(aiMessages)
		.values({
			id,
			conversationId,
			role: message.role,
			content: message.content,
			toolCalls: message.toolCalls ?? null,
			toolResults: message.toolResults ?? null,
			inputTokens: message.inputTokens ?? null,
			outputTokens: message.outputTokens ?? null,
			createdAt: now
		})
		.run();
	return {
		id,
		conversationId,
		role: message.role,
		content: message.content,
		toolCalls: message.toolCalls ?? null,
		toolResults: message.toolResults ?? null,
		inputTokens: message.inputTokens ?? null,
		outputTokens: message.outputTokens ?? null,
		createdAt: now
	};
};

export const listMessages = async (
	db: Database,
	conversationId: string,
	limit = 200
): Promise<AiMessageRow[]> => {
	const rows = await db
		.select()
		.from(aiMessages)
		.where(eq(aiMessages.conversationId, conversationId))
		.orderBy(asc(aiMessages.createdAt))
		.limit(limit)
		.all();
	return rows.map(toRow);
};

export const getMessage = async (db: Database, id: string): Promise<AiMessageRow | null> => {
	const row = await db.select().from(aiMessages).where(eq(aiMessages.id, id)).get();
	return row ? toRow(row) : null;
};

export const clearMessages = async (db: Database, conversationId: string): Promise<void> => {
	await db.delete(aiMessages).where(eq(aiMessages.conversationId, conversationId)).run();
};
