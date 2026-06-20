/** Central domain types shared across the countdown board, stores, and API. */

/**
 * A single goal/milestone countdown.
 *
 * `targetAt` is an absolute instant serialized as an ISO-8601 UTC string — the
 * user picks a local date/time, it is stored as UTC, and the remaining time is
 * always `targetAt − now`, so the value is correct on any device and universal
 * for a shared link. `hasTime` distinguishes a date-only goal (granularity
 * stops at days) from a timed one (down to seconds). No per-countdown color
 * exists by design: the Dropout DS allows a single accent, so countdowns are
 * differentiated by type, size, and position, never hue.
 */
export interface Countdown {
	id: string;
	title: string;
	/** Absolute target instant as an ISO-8601 UTC string. */
	targetAt: string;
	/** Whether a specific time-of-day was set (drives display granularity). */
	hasTime: boolean;
	archived: boolean;
	/** Unguessable token while publicly shared; null when private. */
	shareToken: string | null;
	position: number;
	createdAt: string;
}

/** Fields accepted when creating a countdown. */
export interface CountdownInput {
	title: string;
	targetAt: string;
	hasTime?: boolean;
}

/** Partial update — only defined keys are written. */
export interface CountdownPatch {
	title?: string;
	targetAt?: string;
	hasTime?: boolean;
	archived?: boolean;
}

/** The safe public projection returned for a shared countdown (no ids, no owner). */
export interface PublicCountdown {
	title: string;
	targetAt: string;
	hasTime: boolean;
}

export interface CurrentUser {
	name: string;
	email: string;
}

export interface AppConfig {
	name: string;
	description: string;
	url: string;
	author: {
		name: string;
		url: string;
	};
	siblings: Array<{
		name: string;
		url: string;
	}>;
}
