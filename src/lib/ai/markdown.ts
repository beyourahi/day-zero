/**
 * Minimal hand-rolled markdown parser (no external library) for rendering AI
 * reply text in AiMessage.svelte. Supports bold, italic, inline code, auto-linked
 * URLs/emails/bare domains, headings, bullet/ordered lists, and fenced code blocks.
 * Two surfaces: `parseInlineMarkdown` → flat Segment[]; `parseMarkdown` → block AST.
 * `sanitizeAssistantText` is the pre-render guard that strips internal artifacts.
 * @see src/components/ai/AiMessage.svelte (consumer), ./errors.ts (sibling sanitizer).
 */

export interface MdText {
	type: "text";
	value: string;
}

export interface MdBold {
	type: "bold";
	value: string;
}

export interface MdItalic {
	type: "italic";
	value: string;
}

export interface MdCode {
	type: "code";
	value: string;
}

export interface MdLink {
	type: "link";
	href: string;
	label: string;
}

export type MdInline = MdText | MdBold | MdItalic | MdCode | MdLink;

export interface MdParagraph {
	type: "paragraph";
	lines: MdInline[][];
}

export interface MdHeading {
	type: "heading";
	nodes: MdInline[];
}

export interface MdList {
	type: "list";
	ordered: boolean;
	items: MdInline[][];
}

export interface MdCodeBlock {
	type: "codeblock";
	value: string;
}

export type MdBlock = MdParagraph | MdHeading | MdList | MdCodeBlock;

export type Segment =
	| { type: "text"; value: string }
	| { type: "bold"; value: string }
	| { type: "italic"; value: string }
	| { type: "break" }
	| { type: "bullet"; value: string }
	| { type: "link"; value: string; href: string }
	| { type: "email"; value: string; href: string };

const LINK_PATTERN =
	/(https?:\/\/[^\s),\]]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\b[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.(?:com|org|net|io|app|co|dev|shop|store|ai|xyz|tech|me|info|biz|design|agency|site|online|world)(?:\/[^\s),\]]*)?)/g;

/**
 * Splits text into link/email/plain segments. Trailing sentence punctuation is
 * trimmed off URL matches and the regex cursor rewound, so "see x.com." keeps
 * the period as text rather than swallowing it into the href.
 */
const parseInlineLinks = (text: string): Segment[] => {
	const result: Segment[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	const re = new RegExp(LINK_PATTERN.source, "g");
	while ((match = re.exec(text)) !== null) {
		if (match.index > lastIndex) {
			result.push({ type: "text", value: text.slice(lastIndex, match.index) });
		}
		const matched = match[0];
		if (matched.includes("@")) {
			result.push({ type: "email", value: matched, href: `mailto:${matched}` });
		} else {
			const cleaned = matched.replace(/[.,;:!?)]+$/, "");
			const href = /^https?:\/\//.test(cleaned) ? cleaned : `https://${cleaned}`;
			result.push({ type: "link", value: cleaned, href });
			const trailingLen = matched.length - cleaned.length;
			if (trailingLen > 0) {
				re.lastIndex -= trailingLen;
			}
		}
		lastIndex = re.lastIndex;
	}
	if (lastIndex < text.length) {
		result.push({ type: "text", value: text.slice(lastIndex) });
	}
	return result;
};

export const parseInlineMarkdown = (text: string): Segment[] => {
	const segments: Segment[] = [];
	const lines = text.split("\n");
	for (let li = 0; li < lines.length; li++) {
		const line = lines[li];
		if (line.startsWith("- ")) {
			segments.push({ type: "bullet", value: line.slice(2) });
		} else {
			const parts = line.split(/\*\*(.*?)\*\*/g);
			for (let pi = 0; pi < parts.length; pi++) {
				if (parts[pi] === "") continue;
				if (pi % 2 === 1) {
					segments.push({ type: "bold", value: parts[pi] });
				} else {
					const italicParts = parts[pi].split(/(?:^|(?<=\s))_([^_\n]+?)_(?=\s|$)/g);
					for (let ii = 0; ii < italicParts.length; ii++) {
						if (italicParts[ii] === "") continue;
						if (ii % 2 === 1) {
							segments.push({ type: "italic", value: italicParts[ii] });
						} else {
							segments.push(...parseInlineLinks(italicParts[ii]));
						}
					}
				}
			}
		}
		if (li < lines.length - 1 && !line.startsWith("- ")) {
			segments.push({ type: "break" });
		}
	}
	return segments;
};

const segmentsToInline = (segs: Segment[]): MdInline[] => {
	const out: MdInline[] = [];
	for (const s of segs) {
		if (s.type === "text") out.push({ type: "text", value: s.value });
		else if (s.type === "bold") out.push({ type: "bold", value: s.value });
		else if (s.type === "italic") out.push({ type: "italic", value: s.value });
		else if (s.type === "link") out.push({ type: "link", href: s.href, label: s.value });
		else if (s.type === "email") out.push({ type: "link", href: s.href, label: s.value });
	}
	return out;
};

const FENCE_BLOCK_RE = /```[\s\S]*?```/g;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

/**
 * Pre-render scrub of assistant text: removes fenced code blocks, returns ""
 * if the whole reply is a JSON object/array (a leaked raw tool call), and
 * strips UUIDs so internal countdown identifiers never reach the user.
 * Collapses runs of whitespace.
 */
export const sanitizeAssistantText = (raw: string): string => {
	if (!raw) return "";
	let text = raw.replace(FENCE_BLOCK_RE, " ");
	const trimmed = text.trim();
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
		try {
			const parsed: unknown = JSON.parse(trimmed);
			if (parsed && typeof parsed === "object") return "";
		} catch {
			// Intentional: parse failure means not pure JSON; fall through.
		}
	}
	text = text.replace(UUID_RE, "");
	return text
		.split("\n")
		.map((line) => line.replace(/[ \t]{2,}/g, " ").trimEnd())
		.join("\n")
		.trim();
};

const BULLET_RE = /^\s*[-*]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const HEADING_RE = /^\s*#{1,6}\s+(.*)$/;
const FENCE_RE = /^\s*```/;

const parseInlineToNodes = (raw: string): MdInline[] => segmentsToInline(parseInlineMarkdown(raw));

/** Line-oriented block parser: fenced code, headings, bullet/ordered lists, and paragraphs (consecutive non-blank lines). */
export const parseMarkdown = (raw: string): MdBlock[] => {
	const blocks: MdBlock[] = [];
	const lines = raw.replace(/\r\n/g, "\n").split("\n");
	let para: MdInline[][] = [];
	let i = 0;

	const flushPara = () => {
		if (para.length) {
			blocks.push({ type: "paragraph", lines: para });
			para = [];
		}
	};

	while (i < lines.length) {
		const line = lines[i];

		if (FENCE_RE.test(line)) {
			flushPara();
			const body: string[] = [];
			i++;
			while (i < lines.length && !FENCE_RE.test(lines[i])) {
				body.push(lines[i]);
				i++;
			}
			i++;
			blocks.push({ type: "codeblock", value: body.join("\n") });
			continue;
		}

		if (line.trim() === "") {
			flushPara();
			i++;
			continue;
		}

		const heading = line.match(HEADING_RE);
		if (heading) {
			flushPara();
			blocks.push({ type: "heading", nodes: parseInlineToNodes(heading[1]) });
			i++;
			continue;
		}

		if (BULLET_RE.test(line)) {
			flushPara();
			const items: MdInline[][] = [];
			while (i < lines.length) {
				const match = lines[i].match(BULLET_RE);
				if (!match) break;
				items.push(parseInlineToNodes(match[1]));
				i++;
			}
			blocks.push({ type: "list", ordered: false, items });
			continue;
		}

		if (ORDERED_RE.test(line)) {
			flushPara();
			const items: MdInline[][] = [];
			while (i < lines.length) {
				const match = lines[i].match(ORDERED_RE);
				if (!match) break;
				items.push(parseInlineToNodes(match[1]));
				i++;
			}
			blocks.push({ type: "list", ordered: true, items });
			continue;
		}

		para.push(parseInlineToNodes(line));
		i++;
	}

	flushPara();
	return blocks;
};
