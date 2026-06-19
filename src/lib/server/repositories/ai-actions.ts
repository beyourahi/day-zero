/**
 * D1 persistence for ai_actions — the audit/undo log of every AI Copilot tool execution.
 * Each row carries the inverse needed to reverse it; status tracks its lifecycle
 * (applied → undone/undo_failed, or rejected/failed). All queries are scoped to userId.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../db";
import { aiActions } from "../schema";

export type AiActionStatus = "applied" | "rejected" | "failed" | "undone" | "undo_failed";
export type AiActionSafetyTier = "A" | "B";

export interface AiActionInverse {
	tool: string;
	args: unknown;
	snapshot?: unknown;
}

export interface AiActionRow {
	id: string;
	userId: string;
	conversationId: string | null;
	messageId: string | null;
	toolName: string;
	inputs: unknown;
	inverse: AiActionInverse;
	safetyTier: AiActionSafetyTier;
	requiredConfirmation: boolean;
	anomalyTriggered: string | null;
	applied: boolean;
	status: AiActionStatus;
	error: string | null;
	createdAt: Date;
	undoneAt: Date | null;
}

export interface InsertActionInput {
	userId: string;
	conversationId: string | null;
	messageId: string | null;
	toolName: string;
	inputs: unknown;
	inverse: AiActionInverse;
	safetyTier: AiActionSafetyTier;
	requiredConfirmation: boolean;
	anomalyTriggered: string | null;
	applied: boolean;
	status: AiActionStatus;
	error: string | null;
}

const toRow = (raw: typeof aiActions.$inferSelect): AiActionRow => ({
	id: raw.id,
	userId: raw.userId,
	conversationId: raw.conversationId,
	messageId: raw.messageId,
	toolName: raw.toolName,
	inputs: raw.inputs,
	inverse: raw.inverse as AiActionInverse,
	safetyTier: raw.safetyTier,
	requiredConfirmation: raw.requiredConfirmation,
	anomalyTriggered: raw.anomalyTriggered,
	applied: raw.applied,
	status: raw.status,
	error: raw.error,
	createdAt: raw.createdAt,
	undoneAt: raw.undoneAt ?? null
});

export const insertAction = async (
	db: Database,
	input: InsertActionInput
): Promise<AiActionRow> => {
	const id = crypto.randomUUID();
	const now = new Date();
	await db
		.insert(aiActions)
		.values({
			id,
			userId: input.userId,
			conversationId: input.conversationId,
			messageId: input.messageId,
			toolName: input.toolName,
			inputs: input.inputs,
			inverse: input.inverse,
			safetyTier: input.safetyTier,
			requiredConfirmation: input.requiredConfirmation,
			anomalyTriggered: input.anomalyTriggered,
			applied: input.applied,
			status: input.status,
			error: input.error,
			createdAt: now
		})
		.run();
	return {
		id,
		userId: input.userId,
		conversationId: input.conversationId,
		messageId: input.messageId,
		toolName: input.toolName,
		inputs: input.inputs,
		inverse: input.inverse,
		safetyTier: input.safetyTier,
		requiredConfirmation: input.requiredConfirmation,
		anomalyTriggered: input.anomalyTriggered,
		applied: input.applied,
		status: input.status,
		error: input.error,
		createdAt: now,
		undoneAt: null
	};
};

export const listRecent = async (
	db: Database,
	userId: string,
	limit = 50
): Promise<AiActionRow[]> => {
	const rows = await db
		.select()
		.from(aiActions)
		.where(eq(aiActions.userId, userId))
		.orderBy(desc(aiActions.createdAt))
		.limit(limit)
		.all();
	return rows.map(toRow);
};

export const getActionById = async (
	db: Database,
	userId: string,
	id: string
): Promise<AiActionRow | null> => {
	const row = await db
		.select()
		.from(aiActions)
		.where(and(eq(aiActions.id, id), eq(aiActions.userId, userId)))
		.get();
	return row ? toRow(row) : null;
};

/** Marks an action reversed. SIDE EFFECT: sets status="undone" and stamps undoneAt via the
 * SQLite unixepoch() function (DB clock, not JS Date), keeping it consistent with row defaults. */
export const markUndone = async (db: Database, userId: string, id: string): Promise<void> => {
	await db
		.update(aiActions)
		.set({ status: "undone", undoneAt: sql`(unixepoch())` })
		.where(and(eq(aiActions.id, id), eq(aiActions.userId, userId)))
		.run();
};

export const markUndoFailed = async (
	db: Database,
	userId: string,
	id: string,
	error: string
): Promise<void> => {
	await db
		.update(aiActions)
		.set({ status: "undo_failed", error })
		.where(and(eq(aiActions.id, id), eq(aiActions.userId, userId)))
		.run();
};

export const deleteAction = async (db: Database, userId: string, id: string): Promise<void> => {
	await db
		.delete(aiActions)
		.where(and(eq(aiActions.id, id), eq(aiActions.userId, userId)))
		.run();
};
