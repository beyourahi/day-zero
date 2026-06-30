/**
 * Friendly display names for tool names, shown in AiToolBadge and AiConfirmDialog.
 * Presentation-only; never affects execution. Falls back to "Update" for unknowns.
 */

const TOOL_LABELS: Record<string, string> = {
	createCountdown: "Add countdown",
	updateCountdown: "Update countdown",
	deleteCountdown: "Delete countdown",
	setShareCountdown: "Share countdown"
};

export const toolLabel = (name: string): string => TOOL_LABELS[name] ?? "Update";
