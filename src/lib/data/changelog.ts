/**
 * Changelog data — hand-curated, customer-facing product update entries.
 *
 * Single source of truth for the public `/changelog` route. Each entry is
 * derived from real shipped work but rewritten in plain language for the person
 * who generates client invoices — no commit hashes, branch names, file paths,
 * or engineering jargon. Related commits are consolidated into one coherent
 * entry per theme.
 *
 * Ordering contract: this array IS the render order — newest first. The page
 * groups entries by `date` at render time and does not re-sort. When shipping a
 * new change, prepend its entry here in the same change.
 */

export type ChangelogCategory = "New feature" | "Improvement" | "Fix" | "Performance" | "Design";

export type ChangelogEntry = {
	/** ISO calendar date (YYYY-MM-DD) the change shipped. */
	date: string;
	/** Short, benefit-led, plain-language headline. */
	title: string;
	/** One to three plain-language sentences describing the change. */
	summary: string;
	category: ChangelogCategory;
};

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
	{
		date: "2026-06-19",
		title: "Day Zero is here",
		summary:
			"The first release. Create a countdown toward any goal or milestone, make as many as you like, and see them all at once on one clean board — the soonest goal up top, the rest in a tidy grid, reached goals tucked below. Share any countdown with a read-only link. No ads, ever.",
		category: "New feature"
	}
];
