/**
 * The 5-tool catalog advertised to the model (JSON-schema params + safety tier)
 * plus tier-resolution helpers. Tier A = auto-apply; Tier B = destructive or
 * share-mutating, requires user confirmation in the UI.
 * COUPLING: each tool here must have a matching Zod schema in ./schemas.ts and an
 * executor in ./tools.ts; descriptions/params are sent verbatim to the model.
 * @see ./prompts.ts buildSystemContext (renders this into the system message).
 */

import type { ToolCatalogEntry, SafetyTier } from "./types";

export const TOOLS_CATALOG: ToolCatalogEntry[] = [
	{
		name: "createCountdown",
		description:
			'Create a new countdown to a future goal or milestone. `targetAt` MUST be a full ISO-8601 timestamp (e.g. 2026-08-12T00:00:00.000Z). Set `hasTime` true only when the user specified a time of day; otherwise it is a date-only goal. Resolve relative dates ("next Friday", "in 3 weeks") against the current date given in the turn.',
		safetyTier: "A",
		parameters: {
			type: "object",
			properties: {
				title: { type: "string", description: "Short name of the goal or milestone." },
				targetAt: {
					type: "string",
					description: "The target instant as an ISO-8601 timestamp (UTC)."
				},
				hasTime: {
					type: "boolean",
					description: "True if a specific time of day was given; false for a date-only goal."
				}
			},
			required: ["title", "targetAt"]
		}
	},
	{
		name: "updateCountdown",
		description:
			"Update fields on an existing countdown. Pass only the fields that change. Set `archived` true to hide a countdown from the active board, false to restore it. `targetAt` must be a full ISO-8601 timestamp when changed.",
		safetyTier: "A",
		parameters: {
			type: "object",
			properties: {
				id: { type: "string", description: "ID of the countdown to update." },
				title: { type: "string" },
				targetAt: { type: "string", description: "New target instant as ISO-8601 (UTC)." },
				hasTime: { type: "boolean" },
				archived: { type: "boolean" }
			},
			required: ["id"]
		}
	},
	{
		name: "deleteCountdown",
		description: "Permanently delete a countdown. Requires confirmation.",
		safetyTier: "B",
		parameters: {
			type: "object",
			properties: { id: { type: "string", description: "ID of the countdown to delete." } },
			required: ["id"]
		}
	},
	{
		name: "reorderCountdowns",
		description:
			"Reorder the board. Pass every countdown ID in the desired order, soonest/most-important first.",
		safetyTier: "A",
		parameters: {
			type: "object",
			properties: {
				orderedIds: { type: "array", items: { type: "string" } }
			},
			required: ["orderedIds"]
		}
	},
	{
		name: "setShareCountdown",
		description:
			"Turn public sharing on or off for a countdown. Enabling mints (or reuses) a public link; disabling revokes it. Requires confirmation.",
		safetyTier: "B",
		parameters: {
			type: "object",
			properties: {
				id: { type: "string" },
				enabled: { type: "boolean", description: "True to share publicly, false to make private." }
			},
			required: ["id", "enabled"]
		}
	}
];

/** Tool name → safety tier. `TIER_MAP[name] ?? "A"` is the effective base tier for a call. */
export const TIER_MAP: Record<string, SafetyTier> = Object.fromEntries(
	TOOLS_CATALOG.map((t) => [t.name, t.safetyTier])
);
