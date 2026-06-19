/**
 * Drizzle schema for the entire D1 database: Better Auth tables (users, sessions,
 * accounts, verifications, rate_limits), the app table (countdowns), and the AI
 * Copilot tables (ai_conversations, ai_messages, ai_actions).
 * INVARIANT: column names are snake_case as REQUIRED by the Better Auth Drizzle
 * adapter (usePlural + snake columns); renaming them breaks auth. The countdowns
 * and AI tables cascade-delete from users.id, so removing a user purges their data.
 */
import { relations } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	name: text("name"),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

export const sessions = sqliteTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: text("token").notNull().unique(),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
	},
	(table) => [index("idx_sessions_user_id").on(table.userId)]
);

export const accounts = sqliteTable(
	"accounts",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
		scope: text("scope"),
		idToken: text("id_token"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
	},
	(table) => [
		index("idx_accounts_user_id").on(table.userId),
		uniqueIndex("idx_accounts_provider").on(table.providerId, table.accountId)
	]
);

export const verifications = sqliteTable(
	"verifications",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
	},
	(table) => [index("idx_verifications_identifier").on(table.identifier)]
);

export const rateLimits = sqliteTable(
	"rate_limits",
	{
		id: text("id").primaryKey(),
		key: text("key").notNull(),
		count: integer("count").notNull(),
		lastRequest: integer("last_request").notNull()
	},
	(table) => [index("idx_rate_limits_key").on(table.key)]
);

// One row per countdown. `target_at` is an absolute UTC instant. `share_token` is
// null until the owner publicly shares it; the unique index lets the public
// /s/[token] route resolve a countdown by token without a user scope. Ordering is
// by the explicit `position` column with createdAt tiebreak.
export const countdowns = sqliteTable(
	"countdowns",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: text("title").notNull().default(""),
		targetAt: integer("target_at", { mode: "timestamp" }).notNull(),
		hasTime: integer("has_time", { mode: "boolean" }).notNull().default(false),
		note: text("note").notNull().default(""),
		archived: integer("archived", { mode: "boolean" }).notNull().default(false),
		shareToken: text("share_token").unique(),
		position: integer("position").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index("idx_countdowns_user_id").on(table.userId),
		index("idx_countdowns_user_position").on(table.userId, table.position),
		uniqueIndex("idx_countdowns_share_token").on(table.shareToken)
	]
);

export const aiConversations = sqliteTable(
	"ai_conversations",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [index("ai_conversations_user_updated_idx").on(table.userId, table.updatedAt)]
);

export const aiMessages = sqliteTable(
	"ai_messages",
	{
		id: text("id").primaryKey(),
		conversationId: text("conversation_id")
			.notNull()
			.references(() => aiConversations.id, { onDelete: "cascade" }),
		role: text("role").$type<"user" | "assistant" | "tool" | "system">().notNull(),
		content: text("content").notNull(),
		toolCalls: text("tool_calls", { mode: "json" }).$type<
			Array<{ id: string; name: string; args: unknown }>
		>(),
		toolResults: text("tool_results", { mode: "json" }).$type<
			Array<{ id: string; status: string; error?: string }>
		>(),
		inputTokens: integer("input_tokens"),
		outputTokens: integer("output_tokens"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index("ai_messages_conversation_created_idx").on(table.conversationId, table.createdAt)
	]
);

// Audit/undo log for AI Copilot tool executions. `inverse` (JSON) stores the reverse tool call
// consumed by ai-undo.applyInverse. conversation_id/message_id use ON DELETE SET NULL so the
// action history survives deletion of its originating conversation.
export const aiActions = sqliteTable(
	"ai_actions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		conversationId: text("conversation_id").references(() => aiConversations.id, {
			onDelete: "set null"
		}),
		messageId: text("message_id").references(() => aiMessages.id, { onDelete: "set null" }),
		toolName: text("tool_name").notNull(),
		inputs: text("inputs", { mode: "json" }).$type<unknown>().notNull(),
		inverse: text("inverse", { mode: "json" })
			.$type<{ tool: string; args: unknown; snapshot?: unknown }>()
			.notNull(),
		safetyTier: text("safety_tier").$type<"A" | "B">().notNull(),
		requiredConfirmation: integer("required_confirmation", { mode: "boolean" }).notNull(),
		anomalyTriggered: text("anomaly_triggered"),
		applied: integer("applied", { mode: "boolean" }).notNull(),
		status: text("status")
			.$type<"applied" | "rejected" | "failed" | "undone" | "undo_failed">()
			.notNull(),
		error: text("error"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		undoneAt: integer("undone_at", { mode: "timestamp" })
	},
	(table) => [
		index("ai_actions_user_created_idx").on(table.userId, table.createdAt),
		index("ai_actions_user_status_idx").on(table.userId, table.status)
	]
);

export const usersRelations = relations(users, ({ many }) => ({
	countdowns: many(countdowns),
	aiConversations: many(aiConversations),
	aiActions: many(aiActions)
}));

export const countdownsRelations = relations(countdowns, ({ one }) => ({
	user: one(users, { fields: [countdowns.userId], references: [users.id] })
}));

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
	user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
	messages: many(aiMessages),
	actions: many(aiActions)
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
	conversation: one(aiConversations, {
		fields: [aiMessages.conversationId],
		references: [aiConversations.id]
	})
}));

export const aiActionsRelations = relations(aiActions, ({ one }) => ({
	user: one(users, { fields: [aiActions.userId], references: [users.id] }),
	conversation: one(aiConversations, {
		fields: [aiActions.conversationId],
		references: [aiConversations.id]
	}),
	message: one(aiMessages, { fields: [aiActions.messageId], references: [aiMessages.id] })
}));
