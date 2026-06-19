/**
 * D1 persistence for ai_conversations (AI Copilot chat threads), scoped to userId.
 * Ordering convention: lists and "most recent" use updatedAt desc, so touchUpdatedAt /
 * renameConversation re-float a thread to the top.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../db";
import { aiConversations } from "../schema";

export interface AiConversationRow {
	id: string;
	userId: string;
	title: string;
	createdAt: Date;
	updatedAt: Date;
}

export const createConversation = async (
	db: Database,
	userId: string,
	title: string
): Promise<AiConversationRow> => {
	const id = crypto.randomUUID();
	const now = new Date();
	await db
		.insert(aiConversations)
		.values({ id, userId, title, createdAt: now, updatedAt: now })
		.run();
	return { id, userId, title, createdAt: now, updatedAt: now };
};

export const listConversations = async (
	db: Database,
	userId: string,
	limit = 50
): Promise<AiConversationRow[]> => {
	const rows = await db
		.select()
		.from(aiConversations)
		.where(eq(aiConversations.userId, userId))
		.orderBy(desc(aiConversations.updatedAt))
		.limit(limit)
		.all();
	return rows.map((r) => ({
		id: r.id,
		userId: r.userId,
		title: r.title,
		createdAt: r.createdAt,
		updatedAt: r.updatedAt
	}));
};

export const getConversation = async (
	db: Database,
	userId: string,
	id: string
): Promise<AiConversationRow | null> => {
	const row = await db
		.select()
		.from(aiConversations)
		.where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)))
		.get();
	if (!row) return null;
	return {
		id: row.id,
		userId: row.userId,
		title: row.title,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
};

export const getMostRecentConversation = async (
	db: Database,
	userId: string
): Promise<AiConversationRow | null> => {
	const row = await db
		.select()
		.from(aiConversations)
		.where(eq(aiConversations.userId, userId))
		.orderBy(desc(aiConversations.updatedAt))
		.limit(1)
		.get();
	if (!row) return null;
	return {
		id: row.id,
		userId: row.userId,
		title: row.title,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
};

/** @returns false if no row matched (wrong id or not owned by userId) — used to surface a 404. */
export const renameConversation = async (
	db: Database,
	userId: string,
	id: string,
	title: string
): Promise<boolean> => {
	const result = await db
		.update(aiConversations)
		.set({ title, updatedAt: sql`(unixepoch())` })
		.where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)))
		.run();
	return (result.meta?.changes ?? 0) > 0;
};

export const deleteConversation = async (
	db: Database,
	userId: string,
	id: string
): Promise<void> => {
	await db
		.delete(aiConversations)
		.where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)))
		.run();
};

/** Bumps updatedAt (DB unixepoch()) to re-sort the thread to the top of recency-ordered lists.
 * NOTE: not userId-scoped — caller must have already established ownership. */
export const touchUpdatedAt = async (db: Database, id: string): Promise<void> => {
	await db
		.update(aiConversations)
		.set({ updatedAt: sql`(unixepoch())` })
		.where(eq(aiConversations.id, id))
		.run();
};
