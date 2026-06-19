/**
 * Shared type vocabulary for the AI Copilot layer (client + server). Defines the
 * SSE `Frame` union (the streaming wire protocol), tool-call/inverse shapes, and
 * the confirmation safety tiers. Pure types only — no runtime logic, importable
 * from both Worker and browser.
 */

import type { z } from "zod";

/** A = auto-apply; B = requires user confirmation (destructive / share-mutating). */
export type SafetyTier = "A" | "B";

/**
 * Reverse operation recorded for every applied tool call, enabling undo.
 * `tool` may name a server-only restore tool (e.g. restoreCountdown, noop) not in
 * the model-facing catalog — applied via server applyInverse, not the client
 * executors. @see ./inverse.ts (builders), $lib/server/ai-undo.ts (applier).
 */
export interface InverseRecord {
	tool: string;
	args: unknown;
	snapshot?: unknown;
}

export interface ConfirmationDiffRow {
	label: string;
	current: string;
	proposed: string;
}

export interface ToolCatalogEntry {
	name: string;
	description: string;
	safetyTier: SafetyTier;
	parameters: {
		type: "object";
		properties: Record<string, unknown>;
		required?: string[];
	};
}

export interface ToolDef<Args = unknown, Result = unknown> {
	name: string;
	description: string;
	argSchema: z.ZodType<Args>;
	safetyTier: SafetyTier;
	parameters: ToolCatalogEntry["parameters"];
	humanLabel: (args: Args) => string;
	execute: (args: Args) => Promise<Result>;
	captureInverse: (args: Args, result: Result) => InverseRecord;
}

/** SSE wire protocol, discriminated on `t`. `end` carries usage + the (possibly newly created) conversationId. */
export type Frame =
	| { t: "text"; delta: string }
	| { t: "tool_call"; id: string; name: string; args: unknown }
	| {
			t: "tool_result";
			id: string;
			status: "applied" | "rejected" | "failed" | "pending_confirmation";
			error?: string;
			summary?: string;
			actionId?: string;
	  }
	| {
			t: "end";
			turnId: string;
			conversationId: string;
			inputTokens: number;
			outputTokens: number;
	  }
	| { t: "error"; message: string };

export interface ChatRequestBody {
	conversationId: string | null;
	message: string;
}

export interface ParsedToolCall {
	id: string;
	name: string;
	args: unknown;
}

export interface ExecutionRecord {
	toolName: string;
	inputs: unknown;
	inverse: InverseRecord;
	safetyTier: SafetyTier;
	requiredConfirmation: boolean;
	applied: boolean;
	status: "applied" | "rejected" | "failed";
	error: string | null;
}
