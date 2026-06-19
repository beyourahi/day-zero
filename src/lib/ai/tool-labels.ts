/**
 * Friendly display names for tool names and patch field keys, shown in
 * AiToolBadge and AiConfirmDialog. Presentation-only; never affects execution.
 * Both lookups fall back gracefully (toolLabel → "Update", fieldLabel → the raw key).
 */

const TOOL_LABELS: Record<string, string> = {
	createCountdown: "Add countdown",
	updateCountdown: "Update countdown",
	deleteCountdown: "Delete countdown",
	reorderCountdowns: "Reorder countdowns",
	setShareCountdown: "Share countdown"
};

export const toolLabel = (name: string): string => TOOL_LABELS[name] ?? "Update";

const FIELD_LABELS: Record<string, string> = {
	title: "title",
	targetAt: "target date",
	hasTime: "time of day",
	note: "note",
	archived: "archived",
	enabled: "sharing"
};

export const fieldLabel = (key: string): string => FIELD_LABELS[key] ?? key;
