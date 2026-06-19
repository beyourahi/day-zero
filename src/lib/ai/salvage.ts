/**
 * Recovers tool calls a model emitted as plain-text JSON instead of structured
 * tool-call frames (a known failure mode of some models). Scans the reply
 * text for balanced JSON regions, parses each, and extracts any recognizable
 * tool-call shape (`{tool|name, args|arguments|parameters}` or OpenAI
 * `{function:{name,arguments}}`, optionally wrapped in `{tool_calls:[…]}`).
 * Returns the recovered calls plus the reply text with the consumed JSON region
 * (and stray code fences) stripped. Used as a fallback after native parsing.
 * @see ./client.ts (structured path), src/routes/api/ai/chat/+server.ts.
 */

import type { ParsedToolCall } from "./types";

export interface SalvageResult {
	calls: ParsedToolCall[];
	cleanedText: string;
}

interface JsonRegion {
	raw: string;
	start: number;
	end: number;
}

/** Finds top-level balanced `{…}`/`[…]` spans, string-aware (ignores braces inside quoted strings). */
const extractJsonRegions = (text: string): JsonRegion[] => {
	const regions: JsonRegion[] = [];
	for (let i = 0; i < text.length; i++) {
		const opener = text[i];
		if (opener !== "{" && opener !== "[") continue;
		const closer = opener === "{" ? "}" : "]";
		let depth = 0;
		let inString = false;
		let escaped = false;
		for (let j = i; j < text.length; j++) {
			const char = text[j];
			if (inString) {
				if (escaped) escaped = false;
				else if (char === "\\") escaped = true;
				else if (char === '"') inString = false;
				continue;
			}
			if (char === '"') inString = true;
			else if (char === opener) depth++;
			else if (char === closer) {
				depth--;
				if (depth === 0) {
					regions.push({ raw: text.slice(i, j + 1), start: i, end: j + 1 });
					i = j;
					break;
				}
			}
		}
	}
	return regions;
};

const coerceArgs = (value: unknown): unknown => {
	if (typeof value === "string") {
		try {
			return JSON.parse(value);
		} catch {
			return {};
		}
	}
	return value ?? {};
};

const asToolCall = (value: unknown): ParsedToolCall | null => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const record = value as Record<string, unknown>;
	if (record.function && typeof record.function === "object") {
		const fn = record.function as Record<string, unknown>;
		if (typeof fn.name === "string" && fn.name.length > 0) {
			return {
				id: crypto.randomUUID(),
				name: fn.name,
				args: coerceArgs(fn.arguments ?? fn.args)
			};
		}
	}
	const name =
		typeof record.tool === "string"
			? record.tool
			: typeof record.name === "string"
				? record.name
				: null;
	if (!name) return null;
	return {
		id: crypto.randomUUID(),
		name,
		args: coerceArgs(record.args ?? record.arguments ?? record.parameters)
	};
};

const collectCalls = (parsed: unknown): ParsedToolCall[] => {
	if (Array.isArray(parsed)) {
		return parsed.map(asToolCall).filter((call): call is ParsedToolCall => call !== null);
	}
	if (parsed && typeof parsed === "object") {
		const record = parsed as Record<string, unknown>;
		if (Array.isArray(record.tool_calls)) return collectCalls(record.tool_calls);
		const single = asToolCall(parsed);
		return single ? [single] : [];
	}
	return [];
};

/** Returns the first JSON region that yields at least one tool call; otherwise `{calls: [], cleanedText: text}` unchanged. */
export const salvageTextToolCalls = (text: string): SalvageResult => {
	if (!text || (!text.includes("{") && !text.includes("["))) {
		return { calls: [], cleanedText: text };
	}
	for (const region of extractJsonRegions(text)) {
		let parsed: unknown;
		try {
			parsed = JSON.parse(region.raw);
		} catch {
			continue;
		}
		const calls = collectCalls(parsed);
		if (calls.length > 0) {
			const cleanedText = `${text.slice(0, region.start)}${text.slice(region.end)}`
				.replace(/```[a-z]*/gi, "")
				.trim();
			return { calls, cleanedText };
		}
	}
	return { calls: [], cleanedText: text };
};
